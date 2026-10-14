/* Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0 */
import {planRoute, validateCatalog} from './route.js';

export const MAX_ROUTE_RECORD_BYTES = 262144;
const LEVELS = ['introductory', 'advanced'];
const UTF8 = new TextEncoder();
const ID = /^[A-Za-z][A-Za-z0-9._:-]*$/;
const RESERVED = new Set(['constructor', 'prototype', '__proto__']);

function fail(path, message) {throw new TypeError(`${path}: ${message}`);}

function dataRecord(value, fields, path) {
  if (value === null || typeof value !== 'object' || Array.isArray(value) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail(path, 'expected a plain JSON object');
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== 'string' || !fields.includes(key)) fail(path, 'unknown field; remove unsupported keys and use the documented field allowlist');
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) fail(path, 'expected JSON data fields');
  }
  for (const field of fields) if (!Object.hasOwn(value, field)) fail(path, `missing ${field}`);
}

function dataArray(value, path, min, max) {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype ||
      value.length < min || value.length > max) fail(path, `expected an array with ${min} to ${max} entries`);
  const keys = Reflect.ownKeys(value).filter(key => key !== 'length');
  if (keys.length !== value.length || !keys.every((key, index) => key === String(index))) fail(path, 'expected a dense JSON array');
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) fail(path, 'expected JSON array data');
  }
}

function identifier(value, path) {
  if (typeof value !== 'string' || UTF8.encode(value).length > 128 || !ID.test(value) || RESERVED.has(value)) fail(path, 'expected a safe native identifier');
}

function sameData(actual, expected, path) {
  const equal = (left, right) => {
    if (left === right) return true;
    if (left === null || right === null || typeof left !== 'object' || typeof right !== 'object' || Array.isArray(left) !== Array.isArray(right)) return false;
    const keys = Object.keys(left);
    return keys.length === Object.keys(right).length && keys.every(key => Object.hasOwn(right, key) && equal(left[key], right[key]));
  };
  if (!equal(actual, expected)) fail(path, 'does not match the current reviewed content and deterministic route');
}

function validateChoices(choices, path) {
  dataArray(choices, path, 0, 512);
  choices.forEach((choice, index) => {
    const itemPath = `${path}[${index}]`;
    dataRecord(choice, ['alternatives', 'selected'], itemPath);
    dataArray(choice.alternatives, `${itemPath}.alternatives`, 1, 50);
    choice.alternatives.forEach((alternative, branch) => {
      dataArray(alternative, `${itemPath}.alternatives[${branch}]`, 1, 50);
      alternative.forEach((id, ref) => identifier(id, `${itemPath}.alternatives[${branch}][${ref}]`));
    });
    if (!Number.isSafeInteger(choice.selected) || choice.selected < 0 || choice.selected >= choice.alternatives.length) fail(`${itemPath}.selected`, 'expected an available authored branch index');
  });
}

// Direct API callers receive the same byte limit as reader-selected text. Check
// plain data and depth before serialization, so accessors/cycles never run.
function boundJSON(value) {
  let bytes = 0;
  const add = count => {
    bytes += count;
    if (bytes > MAX_ROUTE_RECORD_BYTES) fail('record', `exceeds ${MAX_ROUTE_RECORD_BYTES} UTF-8 bytes`);
  };
  const visit = (item, depth) => {
    if (depth > 8) fail('record', 'exceeds the route record nesting limit');
    if (typeof item === 'string') {
      if (UTF8.encode(item).length > MAX_ROUTE_RECORD_BYTES) fail('record', `exceeds ${MAX_ROUTE_RECORD_BYTES} UTF-8 bytes`);
      add(UTF8.encode(JSON.stringify(item)).length);
      return;
    }
    if (item === null || typeof item === 'boolean' || (typeof item === 'number' && Number.isFinite(item))) {
      add(String(item).length); return;
    }
    if (typeof item !== 'object' || item === null) fail('record', 'expected bounded JSON data');
    if (Array.isArray(item)) {
      dataArray(item, 'record array', 0, 512);
      add(2 + Math.max(0, item.length - 1));
      for (const child of item) visit(child, depth + 1);
      return;
    }
    if (![Object.prototype, null].includes(Object.getPrototypeOf(item))) fail('record', 'expected plain JSON data');
    const keys = Reflect.ownKeys(item);
    if (keys.length > 16) fail('record', 'too many JSON object fields');
    add(2 + Math.max(0, keys.length - 1));
    for (const key of keys) {
      const descriptor = Object.getOwnPropertyDescriptor(item, key);
      if (typeof key !== 'string' || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) fail('record', 'expected JSON data fields');
      visit(key, depth + 1); add(1); visit(descriptor.value, depth + 1);
    }
  };
  visit(value, 0);
}

/** Replay authoring inputs, refusing stale or edited planner output. */
function currentRoute(catalog, route) {
  validateCatalog(catalog);
  dataRecord(route, ['ok', 'goal', 'known', 'snapshot', 'steps', 'choices'], 'route');
  if (route.ok !== true) fail('route.ok', 'only successful routes can be saved or reordered');
  identifier(route.goal, 'route.goal');
  dataArray(route.known, 'route.known', 0, 50);
  route.known.forEach((id, index) => identifier(id, `route.known[${index}]`));
  if (route.snapshot !== catalog.snapshot) fail('route.snapshot', 'content snapshot has changed; build a new route');
  dataArray(route.steps, 'route.steps', 1, 50);
  route.steps.forEach((step, index) => {
    dataRecord(step, ['id', 'reason'], `route.steps[${index}]`);
    identifier(step.id, `route.steps[${index}].id`);
    if (typeof step.reason !== 'string') fail(`route.steps[${index}].reason`, 'expected a planner reason');
  });
  validateChoices(route.choices, 'route.choices');
  const canonical = planRoute(catalog, {goal: route.goal, known: route.known});
  if (!canonical.ok) fail('route', 'the requested route is no longer available in this reviewed catalogue');
  sameData(route.known, canonical.known, 'route.known');
  sameData(route.choices, canonical.choices, 'route.choices');
  const reasons = new Map(canonical.steps.map(step => [step.id, step.reason]));
  for (const [index, step] of route.steps.entries()) {
    if (reasons.get(step.id) !== step.reason) fail(`route.steps[${index}]`, 'object or reason does not match the current planner');
  }
  const constraints = orderConstraints(catalog, canonical);
  validateOrder(canonical, route.steps.map(step => step.id), constraints);
  return {canonical, constraints};
}

/**
 * Resolve the concrete prerequisites selected in the canonical order. A failed
 * branch cannot have all of its references available before its owning object:
 * missing/context-incompatible targets and active ancestors remain unavailable.
 * Reordering then checks these fixed references, rather than choosing a new OR
 * alternative from whichever objects happen to precede the proposed position.
 */
function orderConstraints(catalog, canonical) {
  const canonicalIds = canonical.steps.map(step => step.id);
  const objects = new Map(catalog.objects.map(object => [object.id, object]));
  const originalPositions = new Map(canonicalIds.map((id, index) => [id, index]));
  const known = new Set(canonical.known.filter(id => id !== canonical.goal));
  const context = objects.get(canonical.goal).context;
  const selectedReferences = (expression, ownerPosition) => {
    if (Object.hasOwn(expression, 'ref')) {
      const target = objects.get(expression.ref);
      if (!target || target.context !== context) return null;
      if (known.has(expression.ref)) return [];
      const position = originalPositions.get(expression.ref);
      return position !== undefined && position < ownerPosition ? [expression.ref] : null;
    }
    if (Object.hasOwn(expression, 'all')) {
      const selected = [];
      for (const child of expression.all) {
        const dependencies = selectedReferences(child, ownerPosition);
        if (dependencies === null) return null;
        selected.push(...dependencies);
      }
      return selected;
    }
    for (const child of expression.any) {
      const selected = selectedReferences(child, ownerPosition);
      if (selected !== null) return selected;
    }
    return null;
  };
  const dependencies = new Map();
  for (const [index, id] of canonicalIds.entries()) {
    const expression = objects.get(id).prerequisite;
    if (expression === null) continue;
    const selected = selectedReferences(expression, index);
    if (selected === null) fail('order', `cannot establish the fixed prerequisites for ${id}`);
    dependencies.set(id, new Set(selected));
  }
  return {ids: canonicalIds, expected: new Set(canonicalIds), dependencies};
}

function validateOrder(canonical, orderedIds, constraints) {
  dataArray(orderedIds, 'order', 1, 50);
  orderedIds.forEach((id, index) => identifier(id, `order[${index}]`));
  if (orderedIds.length !== constraints.ids.length || new Set(orderedIds).size !== orderedIds.length ||
      orderedIds.some(id => !constraints.expected.has(id))) fail('order', 'must contain each planned object exactly once');
  if (orderedIds.at(-1) !== canonical.goal) fail('order', 'the selected goal must remain the final step');
  const proposedPositions = new Map(orderedIds.map((id, index) => [id, index]));
  for (const [id, dependencies] of constraints.dependencies) {
    for (const dependency of dependencies) {
      if (proposedPositions.get(dependency) >= proposedPositions.get(id)) {
        fail('order', `${dependency} must precede ${id}; the recorded prerequisite choices are fixed`);
      }
    }
  }
}

/** Return an independent route; rejected changes never mutate the current one. */
function orderedCanonical(canonical, orderedIds, constraints) {
  validateOrder(canonical, orderedIds, constraints);
  const steps = new Map(canonical.steps.map(step => [step.id, step]));
  return {...canonical, known: [...canonical.known],
    steps: orderedIds.map(id => ({...steps.get(id)})), choices: structuredClone(canonical.choices)};
}

export function reorderRoute(catalog, route, orderedIds) {
  const {canonical, constraints} = currentRoute(catalog, route);
  return orderedCanonical(canonical, orderedIds, constraints);
}

/**
 * Describe every adjacent move using one freshly validated route and one set of
 * fixed prerequisites. In an already valid order, swapping adjacent objects can
 * only invert a dependency between that pair or displace the final goal.
 * Nothing is cached across calls: mutable direct API inputs are checked again.
 */
export function adjacentMovePermissions(catalog, route) {
  const {canonical, constraints} = currentRoute(catalog, route);
  const ids = route.steps.map(step => step.id);
  const allowed = (left, right) => right !== canonical.goal && !constraints.dependencies.get(right)?.has(left);
  return ids.map((id, index) => ({id,
    earlier: index > 0 && allowed(ids[index - 1], id),
    later: index < ids.length - 1 && allowed(id, ids[index + 1])}));
}

function selectedRevisions(catalog, route, level) {
  const selected = new Set([...route.steps.map(step => step.id), ...route.known]);
  return catalog.objects.filter(object => selected.has(object.id)).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0).map(object => {
    const view = object.views.find(item => item.level === level);
    return {id: object.id, conceptId: object.conceptId, context: object.context, revision: object.revision,
      view: {level, revision: view.revision, digest: view.digest}};
  });
}

function position(level, cursor, count) {
  if (!LEVELS.includes(level)) fail('level', 'expected introductory or advanced');
  if (!Number.isSafeInteger(cursor) || cursor < 0 || cursor >= count) fail('cursor', 'expected a current route step index');
}

/** A local reader record: identity and state only, never the source corpus. */
export function createRouteRecord(catalog, route, options) {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) fail('options', 'expected level and cursor options');
  const keys = Reflect.ownKeys(options);
  if (keys.some(key => !['level', 'cursor', 'order'].includes(key))) fail('options', 'unknown field');
  const requiredOptions = Object.hasOwn(options, 'order') ? ['level', 'cursor', 'order'] : ['level', 'cursor'];
  dataRecord(options, requiredOptions, 'options');
  const {canonical, constraints} = currentRoute(catalog, route);
  const current = orderedCanonical(canonical, Object.hasOwn(options, 'order') ? options.order : route.steps.map(step => step.id), constraints);
  position(options.level, options.cursor, current.steps.length);
  const record = {version: 1, language: catalog.language, snapshot: catalog.snapshot, goal: current.goal,
    known: [...current.known], level: options.level, cursor: options.cursor,
    steps: current.steps.map(step => step.id), choices: structuredClone(current.choices),
    revisions: selectedRevisions(catalog, current, options.level)};
  if (UTF8.encode(JSON.stringify(record)).length > MAX_ROUTE_RECORD_BYTES) fail('record', `exceeds ${MAX_ROUTE_RECORD_BYTES} UTF-8 bytes`);
  return record;
}

/** Replan against current reviewed inputs and reconstruct trusted author reasons. */
export function restoreRouteRecord(catalog, record) {
  validateCatalog(catalog);
  dataRecord(record, ['version', 'language', 'snapshot', 'goal', 'known', 'level', 'cursor', 'steps', 'choices', 'revisions'], 'record');
  boundJSON(record);
  if (record.version !== 1) fail('record.version', 'only route record version 1 is supported');
  if (record.language !== catalog.language || record.snapshot !== catalog.snapshot) fail('record.snapshot', 'language or reviewed content snapshot has changed; build a new route');
  identifier(record.goal, 'record.goal');
  dataArray(record.known, 'record.known', 0, 50);
  record.known.forEach((id, index) => identifier(id, `record.known[${index}]`));
  validateChoices(record.choices, 'record.choices');
  dataArray(record.revisions, 'record.revisions', 1, 50);
  for (const [index, revision] of record.revisions.entries()) {
    const path = `record.revisions[${index}]`;
    dataRecord(revision, ['id', 'conceptId', 'context', 'revision', 'view'], path);
    identifier(revision.id, `${path}.id`);
    for (const field of ['conceptId', 'context', 'revision']) if (typeof revision[field] !== 'string' || UTF8.encode(revision[field]).length > 512) fail(`${path}.${field}`, 'expected bounded identity text');
    dataRecord(revision.view, ['level', 'revision', 'digest'], `${path}.view`);
    for (const field of ['level', 'revision', 'digest']) if (typeof revision.view[field] !== 'string' || UTF8.encode(revision.view[field]).length > 512) fail(`${path}.view.${field}`, 'expected bounded view identity text');
  }
  const canonical = planRoute(catalog, {goal: record.goal, known: record.known});
  if (!canonical.ok) fail('record', 'the requested route is unavailable in this reviewed catalogue');
  sameData(record.known, canonical.known, 'record.known');
  sameData(record.choices, canonical.choices, 'record.choices');
  const route = orderedCanonical(canonical, record.steps, orderConstraints(catalog, canonical));
  position(record.level, record.cursor, record.steps.length);
  sameData(record.revisions, selectedRevisions(catalog, canonical, record.level), 'record.revisions');
  if (UTF8.encode(JSON.stringify(record)).length > MAX_ROUTE_RECORD_BYTES) fail('record', `exceeds ${MAX_ROUTE_RECORD_BYTES} UTF-8 bytes`);
  return {route, level: record.level, cursor: record.cursor};
}

/** Bound a reader-selected JSON file before parsing and accepting any state. */
export function parseRouteRecord(catalog, text) {
  if (typeof text !== 'string') fail('record', 'expected JSON text');
  if (UTF8.encode(text).length > MAX_ROUTE_RECORD_BYTES) fail('record', `exceeds ${MAX_ROUTE_RECORD_BYTES} UTF-8 bytes`);
  let record;
  try {record = JSON.parse(text);} catch {fail('record', 'invalid JSON');}
  return restoreRouteRecord(catalog, record);
}

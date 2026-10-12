// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
// Generated from original sibling modules by developer-only tests/bundle.mjs. Do not edit.

const route = (() => {
/* Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0 */

// GW-0 uses reviewed, authored relationships. It does not infer missing knowledge.
const LEVELS = ["introductory", "advanced"];
const ID = /^[A-Za-z][A-Za-z0-9._:-]*$/;
const HASH = /^[a-f0-9]{40}$/;
const RESERVED = new Set(["constructor", "prototype", "__proto__"]);
const MAX_VISITS = 20000;
const UTF8 = new TextEncoder();

function fail(path, message) {
  throw new TypeError(`${path}: ${message}`);
}

function record(value, fields, path) {
  if (value === null || typeof value !== "object" || Array.isArray(value)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    fail(path, "expected a plain object");
  }
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string" || !fields.includes(key)) fail(path, `unknown field ${String(key)}`);
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor.enumerable || !Object.hasOwn(descriptor, "value")) fail(path, "expected JSON data fields");
  }
  return value;
}

function required(value, fields, path) {
  for (const field of fields) if (!Object.hasOwn(value, field)) fail(path, `missing ${field}`);
}

function text(value, path, maximum = 512) {
  if (typeof value !== "string" || !value.trim() || value !== value.trim()
      || UTF8.encode(value).length > maximum || /[\u0000-\u001f\u007f]/u.test(value)) {
    fail(path, `expected nonblank text without control characters (maximum ${maximum} UTF-8 bytes)`);
  }
  return value;
}

function identifier(value, path, maximum = 128) {
  text(value, path, maximum);
  if (!ID.test(value) || RESERVED.has(value)) fail(path, "expected a safe native identifier");
  return value;
}

function hash(value, path) {
  if (typeof value !== "string" || !HASH.test(value)) fail(path, "expected 40 lowercase hexadecimal characters");
}

function array(value, path, minimum, maximum) {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum) {
    fail(path, `expected an array with ${minimum} to ${maximum} entries`);
  }
  // Reject holes and custom properties rather than silently treating them as JSON.
  const keys = Reflect.ownKeys(value).filter(key => key !== "length");
  if (Object.getPrototypeOf(value) !== Array.prototype || keys.length !== value.length
      || !keys.every((key, index) => key === String(index))) fail(path, "expected a dense JSON array");
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor.enumerable || !Object.hasOwn(descriptor, "value")) fail(path, "expected JSON array data");
  }
}

/** Validate the bounded GW-0 interchange contract. This never changes the input. */
function validateCatalog(catalog) {
  record(catalog, ["version", "language", "snapshot", "objects", "defaultGoal", "defaultLevel"], "catalog");
  required(catalog, ["version", "language", "snapshot", "objects", "defaultGoal", "defaultLevel"], "catalog");
  if (catalog.version !== 0) fail("catalog.version", "only version 0 is supported");
  if (catalog.language !== "en") fail("catalog.language", "GW-0 supports en only");
  hash(catalog.snapshot, "catalog.snapshot");
  array(catalog.objects, "catalog.objects", 1, 50);
  identifier(catalog.defaultGoal, "catalog.defaultGoal");
  if (!LEVELS.includes(catalog.defaultLevel)) fail("catalog.defaultLevel", "unknown expertise level");

  const ids = new Set();
  let expressionCount = 0;
  const validateExpression = (expression, path, depth) => {
    if (depth > 16) fail(path, "prerequisites exceed depth 16");
    if (++expressionCount > 512) fail(path, "catalog exceeds 512 prerequisite expressions");
    record(expression, ["ref", "all", "any"], path);
    const keys = Object.keys(expression);
    if (keys.length !== 1) fail(path, "expected exactly one of ref, all or any");
    const key = keys[0];
    if (key === "ref") {
      identifier(expression.ref, `${path}.ref`);
    } else {
      array(expression[key], `${path}.${key}`, 1, 50);
      expression[key].forEach((child, index) => validateExpression(child, `${path}.${key}[${index}]`, depth + 1));
    }
  };

  catalog.objects.forEach((object, index) => {
    const path = `catalog.objects[${index}]`;
    const fields = ["id", "conceptId", "revision", "label", "context", "reviewedBy", "views", "prerequisite"];
    record(object, fields, path);
    required(object, fields, path);
    identifier(object.id, `${path}.id`);
    if (ids.has(object.id)) fail(`${path}.id`, "duplicate object identifier");
    ids.add(object.id);
    text(object.conceptId, `${path}.conceptId`, 512);
    if (!/^[A-Za-z][A-Za-z0-9+.-]*:[^\s<>"']+$/u.test(object.conceptId)) fail(`${path}.conceptId`, "expected a scoped concept URI without whitespace or unsafe delimiters");
    text(object.revision, `${path}.revision`, 128);
    text(object.label, `${path}.label`, 256);
    text(object.context, `${path}.context`, 128);
    text(object.reviewedBy, `${path}.reviewedBy`, 256);
    array(object.views, `${path}.views`, 2, 2);
    const levels = new Set();
    object.views.forEach((view, viewIndex) => {
      const viewPath = `${path}.views[${viewIndex}]`;
      const viewFields = ["level", "revision", "reviewedBy", "anchor", "digest"];
      record(view, viewFields, viewPath);
      required(view, viewFields, viewPath);
      if (!LEVELS.includes(view.level) || levels.has(view.level)) fail(`${viewPath}.level`, "expected one view of each expertise level");
      levels.add(view.level);
      text(view.revision, `${viewPath}.revision`, 128);
      text(view.reviewedBy, `${viewPath}.reviewedBy`, 256);
      identifier(view.anchor, `${viewPath}.anchor`, 160);
      hash(view.digest, `${viewPath}.digest`);
    });
    if (object.prerequisite !== null) validateExpression(object.prerequisite, `${path}.prerequisite`, 1);
  });
  if (!ids.has(catalog.defaultGoal)) fail("catalog.defaultGoal", "default goal is unavailable");
  return catalog;
}

function issue(code, message, path) {
  return { code, message: message.length > 2048 ? `${message.slice(0, 2045)}...` : message, path };
}

function references(expression) {
  if (Object.hasOwn(expression, "ref")) return [expression.ref];
  return [...new Set((expression.all ?? expression.any).flatMap(references))];
}

/**
 * Compose a prerequisite-first route, choosing the first feasible authored OR branch.
 * This policy is deterministic, not a claim of shortest or pedagogically optimal paths.
 * Invalid contract/options throw; unavailable or incompatible routes return ok:false.
 */
function planRoute(catalog, options = {}) {
  validateCatalog(catalog);
  record(options, ["goal", "known"], "options");
  const goal = Object.hasOwn(options, "goal") ? identifier(options.goal, "options.goal") : catalog.defaultGoal;
  const suppliedKnown = Object.hasOwn(options, "known") ? options.known : [];
  array(suppliedKnown, "options.known", 0, 50);
  const known = suppliedKnown.map((id, index) => identifier(id, `options.known[${index}]`));
  if (new Set(known).size !== known.length) fail("options.known", "duplicate known identifier");
  known.sort();
  const base = { goal, known, snapshot: catalog.snapshot };
  const objects = new Map(catalog.objects.map((object) => [object.id, object]));
  const goalObject = objects.get(goal);
  const failure = (issues) => ({ ok: false, ...base, steps: [], issues });
  if (!goalObject) return failure([issue("unavailable-goal", `The selected goal ${goal} is unavailable.`, goal)]);

  const knownIssues = [];
  for (const id of known) {
    const object = objects.get(id);
    if (!object) knownIssues.push(issue("unavailable-known", `Known object ${id} is unavailable.`, id));
    else if (object.context !== goalObject.context) knownIssues.push(issue("incompatible-context", `Known object ${id} has a different declared context from ${goal}.`, id));
  }
  if (knownIssues.length) return failure(knownIssues);

  const knownSet = new Set(known);
  let done = new Set();
  let steps = [];
  let choices = [];
  const active = new Set();
  let visits = 0;

  const visitExpression = (expression, parent, path) => {
    if (Object.hasOwn(expression, "ref")) return visitObject(expression.ref, parent, path);
    if (Object.hasOwn(expression, "all")) {
      for (let index = 0; index < expression.all.length; index++) {
        const error = visitExpression(expression.all[index], parent, `${path}.all[${index}]`);
        if (error) return error;
      }
      return null;
    }
    const branchIssues = [];
    for (let index = 0; index < expression.any.length; index++) {
      const checkpoint = { done: new Set(done), steps: steps.slice(), choices: choices.slice() };
      const error = visitExpression(expression.any[index], parent, `${path}.any[${index}]`);
      if (!error) {
        choices.push({ alternatives: expression.any.map(references), selected: index });
        return null;
      }
      done = checkpoint.done;
      steps = checkpoint.steps;
      choices = checkpoint.choices;
      branchIssues.push(error);
      if (error.code === "search-limit") return error;
    }
    return issue("unsatisfied-alternatives", `No authored prerequisite alternative for ${parent} is available: ${branchIssues.map((error) => error.message).join(" ")}`, path);
  };

  const visitObject = (id, parent, path) => {
    if (++visits > MAX_VISITS) return issue("search-limit", "Route search exceeded its bounded work limit.", path);
    const object = objects.get(id);
    if (!object) return issue("unavailable-object", `Required reviewed object ${id} is unavailable.`, path);
    if (object.context !== goalObject.context) return issue("incompatible-context", `Required object ${id} has a different declared context from ${goal}.`, path);
    if (id !== goal && knownSet.has(id)) return null;
    if (active.has(id)) return issue("cycle", `Prerequisite cycle encountered at ${id}.`, path);
    if (done.has(id)) return null;
    active.add(id);
    try {
      const error = object.prerequisite === null ? null : visitExpression(object.prerequisite, id, `${id}.prerequisite`);
      if (error) return error;
      done.add(id);
      steps.push({ id, reason: id === goal ? "Selected goal" : `Prerequisite for ${parent}` });
      return null;
    } finally {
      active.delete(id);
    }
  };

  const error = visitObject(goal, null, goal);
  if (error) return failure([error]);
  return { ok: true, ...base, steps, choices };
}

return {validateCatalog,planRoute};
})();

const session = (() => {
/* Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0 */
const {planRoute, validateCatalog} = route;

const MAX_ROUTE_RECORD_BYTES = 262144;
const LEVELS = ['introductory', 'advanced'];
const UTF8 = new TextEncoder();
const ID = /^[A-Za-z][A-Za-z0-9._:-]*$/;
const RESERVED = new Set(['constructor', 'prototype', '__proto__']);

function fail(path, message) {throw new TypeError(`${path}: ${message}`);}

function dataRecord(value, fields, path) {
  if (value === null || typeof value !== 'object' || Array.isArray(value) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail(path, 'expected a plain JSON object');
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== 'string' || !fields.includes(key)) fail(path, `unknown field ${String(key)}`);
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

function reorderRoute(catalog, route, orderedIds) {
  const {canonical, constraints} = currentRoute(catalog, route);
  return orderedCanonical(canonical, orderedIds, constraints);
}

/**
 * Describe every adjacent move using one freshly validated route and one set of
 * fixed prerequisites. In an already valid order, swapping adjacent objects can
 * only invert a dependency between that pair or displace the final goal.
 * Nothing is cached across calls: mutable direct API inputs are checked again.
 */
function adjacentMovePermissions(catalog, route) {
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
function createRouteRecord(catalog, route, options) {
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
function restoreRouteRecord(catalog, record) {
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
function parseRouteRecord(catalog, text) {
  if (typeof text !== 'string') fail('record', 'expected JSON text');
  if (UTF8.encode(text).length > MAX_ROUTE_RECORD_BYTES) fail('record', `exceeds ${MAX_ROUTE_RECORD_BYTES} UTF-8 bytes`);
  let record;
  try {record = JSON.parse(text);} catch {fail('record', 'invalid JSON');}
  return restoreRouteRecord(catalog, record);
}

return {MAX_ROUTE_RECORD_BYTES,reorderRoute,adjacentMovePermissions,createRouteRecord,restoreRouteRecord,parseRouteRecord};
})();

const navigation = (() => {
// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0

const isDetails = node => node?.localName === 'details';
const isCollapse = node => node?.classList?.contains('collapse') || node?.classList?.contains('collapsing');
const isDisclosure = node => isDetails(node) || isCollapse(node);
const ancestry = target => {
  const nodes = [];
  for (let node = target; node; node = node.parentElement) nodes.push(node);
  return nodes;
};
const concealed = node => node.hidden || node.getAttribute('aria-hidden')?.toLowerCase() === 'true' ||
  node.inert || node.getAttribute('inert') !== null;

/**
 * Reveal native destinations without changing authored hidden/privacy boundaries.
 * Only native details and Bootstrap collapse state are managed. The caller owns
 * reviewed-view selection, focus, scrolling and print labels. Snapshots are
 * opaque, page-local values; they contain no serializable reader information.
 */
function createVisibilityManager(native, doc = document) {
  const roots = [...native.values()].map(item => item.node).filter(Boolean);
  const owned = target => roots.some(root => root === target || root.contains(target));
  const disclosures = new Set();
  for (const root of roots) {
    for (const node of ancestry(root)) if (isDisclosure(node)) disclosures.add(node);
    for (const node of root.querySelectorAll('details, .collapse, .collapsing')) disclosures.add(node);
  }

  // Quarto callouts use Bootstrap's single-ID data attributes. aria-controls
  // also covers a shared toggle when it lists several native collapse IDs.
  // Author selectors are never interpolated into new selectors or evaluated.
  const controls = new Map();
  for (const control of doc.querySelectorAll('[data-bs-toggle="collapse"]')) {
    let ids = (control.getAttribute('aria-controls') || '').trim().split(/\s+/).filter(Boolean);
    if (ids.length === 0) {
      const fragment = control.getAttribute('data-bs-target') || control.getAttribute('href') || '';
      if (fragment.startsWith('#') && fragment.length > 1 && !/[\s,]/.test(fragment)) ids = [fragment.slice(1)];
    }
    const targets = ids.map(id => doc.getElementById(id)).filter(isCollapse);
    if (targets.some(target => disclosures.has(target))) controls.set(control, targets);
  }

  const snapshots = new WeakMap();
  const printFrames = [];
  let disposed = false;
  const read = () => ({
    disclosures: [...disclosures].map(node => isDetails(node)
      ? {node, open: node.open}
      : {node, show: node.classList.contains('show')}),
    controls: [...controls.keys()].map(node => ({
      node, expanded: node.getAttribute('aria-expanded'), collapsed: node.classList.contains('collapsed')
    }))
  });
  const write = state => {
    for (const saved of state.disclosures) {
      if (isDetails(saved.node)) saved.node.open = saved.open;
      else saved.node.classList.toggle('show', saved.show);
    }
    for (const saved of state.controls) {
      if (saved.expanded === null) saved.node.removeAttribute('aria-expanded');
      else saved.node.setAttribute('aria-expanded', saved.expanded);
      saved.node.classList.toggle('collapsed', saved.collapsed);
    }
  };
  const baseline = read();
  // A native tab pane or an author stylesheet can conceal a destination without
  // setting hidden/aria-hidden. Check styles after opening supported containers:
  // a closed details/collapse is revealable, while an inactive tab must still be
  // activated through its author's control. Geometry alone would misclassify
  // display:contents and empty native anchors.
  const cssConcealed = nodes => {
    const view = doc.defaultView;
    if (typeof view?.getComputedStyle !== 'function') return false;
    return nodes.some(node => {
      const style = view.getComputedStyle(node);
      return style.display === 'none' || style.visibility === 'hidden' ||
        style.visibility === 'collapse' || style.contentVisibility === 'hidden';
    });
  };
  const updateControls = changed => {
    for (const [control, targets] of controls) {
      if (!targets.some(target => changed.has(target))) continue;
      const expanded = targets.some(target => target.classList.contains('show'));
      control.setAttribute('aria-expanded', String(expanded));
      control.classList.toggle('collapsed', !expanded);
    }
  };
  const open = nodes => {
    // Outer disclosures open first. Bootstrap transitions are not invoked:
    // native fragment navigation must reveal synchronously, without motion.
    const ordered = [...nodes].sort((first, second) => ancestry(first).length - ancestry(second).length);
    for (const node of ordered) {
      if (isDetails(node)) node.open = true;
      else node.classList.add('show');
    }
    updateControls(new Set(nodes.filter(isCollapse)));
  };
  const capture = () => {
    if (disposed) return null;
    const snapshot = Object.freeze({});
    snapshots.set(snapshot, read());
    return snapshot;
  };
  const restore = snapshot => {
    if (disposed || !snapshot || !snapshots.has(snapshot)) return false;
    write(snapshots.get(snapshot));
    return true;
  };

  return Object.freeze({
    reveal(target) {
      if (disposed) return {ok: false, message: 'Native navigation is no longer active.'};
      if (!target || !owned(target)) return {ok: false, message: 'This destination is outside the reviewed learning objects.'};
      const nodes = ancestry(target);
      if (nodes.some(concealed)) return {
        ok: false,
        message: 'This destination is inside authored hidden or inert content. Choose another reviewed view or make that content visible using its author-provided control.'
      };
      const relevant = nodes.filter(node => disclosures.has(node));
      if (relevant.some(node => node.classList.contains('collapsing'))) return {
        ok: false, message: 'A native callout is still opening or closing. Try this destination again when the transition finishes.'
      };
      const previous = read();
      try {
        open(relevant);
        if (cssConcealed(nodes)) {
          write(previous);
          return {ok: false, message: 'This destination is still hidden by its page styles or inactive tab. Make it visible using its author-provided control, then try this destination again.'};
        }
      } catch {
        write(previous);
        return {ok: false, message: 'This destination could not be checked for visibility. Make it visible using its author-provided control, then try this destination again.'};
      }
      return {ok: true};
    },
    capture,
    restore,
    reset() {
      if (disposed) return;
      printFrames.length = 0;
      write(baseline);
    },
    printStart() {
      if (disposed) return {ok: false, message: 'Native navigation is no longer active.'};
      printFrames.push(capture());
      const printable = [...disclosures].filter(node => !ancestry(node).some(concealed));
      const stable = printable.filter(node => !node.classList.contains('collapsing'));
      open(stable);
      return stable.length === printable.length ? {ok: true} : {
        ok: false, message: 'A native callout was transitioning when printing began. Wait until it finishes before printing again.'
      };
    },
    printEnd() {
      if (disposed || printFrames.length === 0) return false;
      return restore(printFrames.pop());
    },
    dispose() {
      if (disposed) return;
      printFrames.length = 0;
      write(baseline);
      disposed = true;
    }
  });
}

return {createVisibilityManager};
})();

const generative_websites = (() => {
// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
const {validateCatalog, planRoute} = route;
const {createRouteRecord, parseRouteRecord, reorderRoute, adjacentMovePermissions, MAX_ROUTE_RECORD_BYTES} = session;
const {createVisibilityManager} = navigation;

const mounted = new WeakMap();
const MAX_EXCURSIONS = 64;

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function button(text) {
  const node = element('button', text);
  node.type = 'button';
  return node;
}

function option(value, label) {
  const node = element('option', label);
  node.value = value;
  return node;
}

function labelledSelect(labelText, options) {
  // Wrapping the control in its label avoids generated ID collisions.
  const label = element('label', labelText);
  const select = element('select');
  for (const item of options) select.append(option(item.value, item.label));
  label.append(select);
  return {label, select};
}

function issueText(issues) {
  return (Array.isArray(issues) ? issues : []).map(issue =>
    typeof issue?.message === 'string' ? issue.message : 'The requested route is unavailable.'
  ).join(' ') || 'The requested route is unavailable.';
}

/** In-memory LIFO snapshots; known selections are copied before an excursion. */
function createExcursionStack() {
  const frames = [];
  return Object.freeze({
    get depth() {return frames.length;},
    push(frame) {
      if (frames.length >= MAX_EXCURSIONS) throw new RangeError(`At most ${MAX_EXCURSIONS} nested concept explorations can be open. Return from an exploration before opening another.`);
      frames.push(Object.freeze({...frame, known: Object.freeze([...frame.known])}));
    },
    pop() {return frames.pop();},
    clear() {frames.length = 0;}
  });
}

/** Resolve IDs without CSS selectors, and refuse ambiguous or mismatched markup. */
function resolveNativeViews(catalog, doc = document) {
  const ids = new Map();
  for (const node of doc.querySelectorAll('[id]')) {
    const matches = ids.get(node.id) || [];
    matches.push(node);
    ids.set(node.id, matches);
  }
  const unique = id => {
    const nodes = ids.get(id);
    if (!nodes || nodes.length !== 1) throw new Error(`Native anchor ${id} is missing or ambiguous.`);
    return nodes[0];
  };
  const objects = new Map();
  for (const object of catalog.objects) {
    const node = unique(object.id);
    if (!node.classList.contains('learning-object')) throw new Error(`Native object ${object.id} does not match its catalogue.`);
    const views = new Map();
    for (const view of object.views) {
      const source = unique(view.anchor);
      if (!source.classList.contains('learning-view') ||
          source.getAttribute('data-learning-level') !== view.level ||
          source.getAttribute('data-learning-object') !== object.id ||
          source.closest('.learning-object') !== node) {
        throw new Error(`Native view ${view.anchor} does not match its reviewed object and level.`);
      }
      views.set(view.level, source);
    }
    objects.set(object.id, {node, views});
  }
  return objects;
}

/** Resolve fragments in validated views or their object's common native content. */
function resolveNativeFragment(hash, native, doc = document) {
  if (typeof hash !== 'string' || !hash.startsWith('#') || hash.length === 1) return null;
  let id;
  try {id = decodeURIComponent(hash.slice(1));} catch {return null;}
  const target = doc.getElementById(id);
  const owner = target?.closest?.('.learning-view');
  for (const {node, views} of native.values()) {
    for (const [level, view] of views) if (view === owner) return {target, level};
    if (target && (target === node || node?.contains?.(target))) return {target, level: null};
  }
  return null;
}

/** Ignore anchors to other pages, queries, origins and non-fragment resources. */
function samePageFragment(href, currentURL) {
  try {
    const current = new URL(currentURL);
    const target = new URL(href, current);
    return target.origin === current.origin && target.pathname === current.pathname &&
      target.search === current.search && target.hash ? target.hash : null;
  } catch {return null;}
}

/** Mount one page-local, network-free route controller. Returns an idempotent cleanup. */
function enhance(panel) {
  if (mounted.has(panel)) return mounted.get(panel);
  const slot = panel.querySelector(':scope > .generative-websites-enhancement');
  const raw = panel.querySelector(':scope > script.generative-websites-data');
  if (!slot || !raw) return () => {};
  const previousChildren = [...slot.childNodes];
  const previousHidden = slot.hidden;
  let catalog, native;
  try {
    catalog = validateCatalog(JSON.parse(raw.textContent));
    native = resolveNativeViews(catalog, panel.ownerDocument);
  } catch (error) {
    const message = element('p', `Interactive route unavailable: ${error.message} All authored content remains available.`, 'generative-websites-status');
    message.setAttribute('role', 'status');
    slot.replaceChildren(message);
    slot.hidden = false;
    let disposed = false;
    const cleanup = () => {
      if (disposed) return;
      disposed = true;
      window.removeEventListener('pagehide', cleanup);
      slot.replaceChildren(...previousChildren);
      slot.hidden = previousHidden;
      mounted.delete(panel);
    };
    mounted.set(panel, cleanup);
    window.addEventListener('pagehide', cleanup, {once: true});
    return cleanup;
  }

  const controller = new AbortController();
  const listen = (node, event, handler) => node.addEventListener(event, handler, {signal: controller.signal});
  const initialViews = new Map();
  const initialTabIndices = new Map();
  for (const {node, views} of native.values()) {
    initialTabIndices.set(node, node.getAttribute('tabindex'));
    for (const view of views.values()) initialViews.set(view, view.hidden);
  }
  const restoreViews = () => {
    for (const [view, hidden] of initialViews) view.hidden = hidden;
  };
  const visibility = createVisibilityManager(native, panel.ownerDocument);
  const objects = new Map(catalog.objects.map(object => [object.id, object]));
  const objectOptions = catalog.objects.map(object => ({value: object.id, label: object.label}));
  const controls = element('form', undefined, 'generative-websites-controls');
  const goal = labelledSelect('Learning goal ', objectOptions);
  goal.select.value = catalog.defaultGoal;
  const expertise = labelledSelect('Reviewed level ', [
    {value: 'introductory', label: 'Introductory'},
    {value: 'advanced', label: 'Advanced'}
  ]);
  expertise.select.value = catalog.defaultLevel;
  const knownField = element('fieldset', undefined, 'generative-websites-known');
  knownField.append(element('legend', 'Concepts you already know'));
  const knownInputs = new Map();
  for (const object of catalog.objects) {
    const label = element('label');
    const input = element('input');
    input.type = 'checkbox';
    input.value = object.id;
    label.append(input, document.createTextNode(` ${object.label}`));
    knownInputs.set(object.id, input);
    knownField.append(label);
  }
  const build = button('Build route');
  build.type = 'submit';
  const reset = button('Reset');
  const exportRoute = button('Download route JSON');
  exportRoute.disabled = true;
  const importLabel = element('label', 'Restore a saved route ', 'generative-websites-import');
  const importRoute = element('input');
  importRoute.type = 'file';
  importRoute.accept = '.json,application/json';
  importLabel.append(importRoute);
  const actions = element('div', undefined, 'generative-websites-actions');
  actions.append(build, reset, exportRoute);
  controls.append(goal.label, expertise.label, knownField, actions, importLabel);

  const status = element('p', undefined, 'generative-websites-status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-atomic', 'true');
  const routeRegion = element('nav', undefined, 'generative-websites-route');
  routeRegion.setAttribute('aria-label', 'Learning route');
  const routeTitle = element('p', 'Learning route');
  routeTitle.className = 'generative-websites-route-title';
  const routeList = element('ol');
  const position = element('p', undefined, 'generative-websites-position');
  const previous = button('Previous step');
  const next = button('Next step');
  const routeActions = element('div', undefined, 'generative-websites-actions');
  routeActions.append(previous, next);
  routeRegion.append(routeTitle, routeList, position, routeActions);
  const exploration = element('section', undefined, 'generative-websites-exploration');
  exploration.setAttribute('aria-label', 'Concept exploration');
  const exploreChoice = labelledSelect('Explore a concept ', objectOptions);
  const explore = button('Explore concept');
  const back = button('Return from exploration');
  back.disabled = true;
  const excursionStatus = element('p', 'Exploring a concept preserves your route and current step.');
  const exploreActions = element('div', undefined, 'generative-websites-actions');
  exploreActions.append(explore, back);
  exploration.append(exploreChoice.label, exploreActions, excursionStatus);
  const snapshot = element('p', `Reviewed content snapshot ${catalog.snapshot.slice(0, 12)}. Routes use the fixed revisions included on this page.`, 'generative-websites-snapshot');
  slot.replaceChildren(controls, status, routeRegion, exploration, snapshot);
  slot.hidden = false;

  let route = null;
  let cursor = 0;
  let level = catalog.defaultLevel;
  let activeObject = null;
  let disposed = false;
  let actionEpoch = 0;
  const excursions = createExcursionStack();
  let routeLinks = [];
  const downloadURLs = new Set();
  const downloadTimers = new Set();
  const returnBars = new Map();
  for (const [id, {node}] of native) {
    const bar = element('div', undefined, 'generative-websites-return');
    const returnButton = button('Return to saved position');
    bar.hidden = true;
    bar.append(returnButton);
    node.prepend(bar);
    returnBars.set(id, {bar, returnButton});
  }
  const knownValues = () => [...knownInputs].filter(([, input]) => input.checked).map(([id]) => id);
  const applyLevel = () => {
    for (const {views} of native.values()) {
      for (const [viewLevel, view] of views) view.hidden = initialViews.get(view) || viewLevel !== level;
    }
    for (const {id, link} of routeLinks) link.href = `#${objects.get(id).views.find(view => view.level === level).anchor}`;
  };
  const followNativeFragment = (hash, scroll = false) => {
    const fragment = resolveNativeFragment(hash, native, panel.ownerDocument);
    if (!fragment) return;
    const oldLevel = level;
    const oldFocus = panel.ownerDocument.activeElement;
    if (fragment.level && level !== fragment.level) {
      level = fragment.level;
      expertise.select.value = level;
      if (route) applyLevel();
      status.textContent = route
        ? `Native link selected reviewed ${level} views. Your route and its prerequisites are unchanged.`
        : `Native link selected the reviewed ${level} level. All authored views remain available until you build a route.`;
    }
    const revealed = visibility.reveal(fragment.target);
    if (!revealed.ok) {
      level = oldLevel; expertise.select.value = oldLevel;
      if (route) applyLevel();
      status.textContent = revealed.message; return;
    }
    actionEpoch++;
    if (oldFocus?.closest?.('.learning-view')?.hidden) {
      if (!initialTabIndices.has(fragment.target)) initialTabIndices.set(fragment.target, fragment.target.getAttribute('tabindex'));
      if (!fragment.target.hasAttribute('tabindex')) fragment.target.tabIndex = -1;
      fragment.target.focus({preventScroll: true});
    }
    // Initial fragment navigation can have occurred while its target was hidden.
    // Reveal and scroll to the native target without moving reader focus.
    if (scroll) fragment.target.scrollIntoView({block: 'start', behavior: 'instant'});
  };
  const focusObject = id => {
    const item = native.get(id);
    if (!item) return;
    const revealed = visibility.reveal(item.views.get(level));
    if (!revealed.ok) {status.textContent = revealed.message; return false;}
    if (!item.node.hasAttribute('tabindex')) item.node.tabIndex = -1;
    item.node.focus({preventScroll: true});
    item.node.scrollIntoView({block: 'start', behavior: 'instant'});
    return true;
  };
  const updatePosition = () => {
    const count = route?.steps.length || 0;
    for (let index = 0; index < routeLinks.length; index++) {
      const {link} = routeLinks[index];
      if (index === cursor) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
    }
    previous.disabled = !route || excursions.depth > 0 || cursor <= 0 || count === 0;
    next.disabled = !route || excursions.depth > 0 || cursor >= count - 1 || count === 0;
    build.disabled = excursions.depth > 0;
    back.disabled = excursions.depth === 0;
    exportRoute.disabled = !route || excursions.depth > 0;
    importRoute.disabled = excursions.depth > 0;
    for (const [id, {bar}] of returnBars) bar.hidden = excursions.depth === 0 || id !== activeObject;
    for (const {link, moves} of routeLinks) {
      if (excursions.depth) link.setAttribute('aria-disabled', 'true');
      else link.removeAttribute('aria-disabled');
      for (const {node, allowed} of moves) node.disabled = !allowed || excursions.depth > 0;
    }
    if (!route) position.textContent = 'No route selected.';
    else if (count === 0) position.textContent = 'The selected goal is already included in your starting knowledge.';
    else position.textContent = `Step ${cursor + 1} of ${count}: ${objects.get(route.steps[cursor].id).label}.`;
    if (excursions.depth > 0) {
      excursionStatus.textContent = `Exploration depth ${excursions.depth}: ${objects.get(activeObject).label}. Your route is paused. Return before building another route.`;
    } else excursionStatus.textContent = 'Exploring a concept preserves your route and current step.';
  };
  const selectStep = (index, moveFocus = true) => {
    if (!route || excursions.depth || !Number.isSafeInteger(index) || index < 0 || index >= route.steps.length) return;
    const revealed = visibility.reveal(native.get(route.steps[index].id).views.get(level));
    if (!revealed.ok) {status.textContent = revealed.message; return;}
    actionEpoch++;
    cursor = index;
    activeObject = route.steps[index].id;
    updatePosition();
    if (moveFocus) focusObject(activeObject);
  };
  const renderRoute = () => {
    // Prepare fixed prerequisites once for the display. An actual move still
    // calls reorderRoute and validates fresh author/route state before commit.
    const permissions = route ? adjacentMovePermissions(catalog, route) : [];
    routeList.replaceChildren();
    routeLinks = [];
    if (route) for (const [index, step] of route.steps.entries()) {
      const item = element('li');
      const link = element('a', objects.get(step.id).label);
      const reason = element('span', ` — ${step.reason}`, 'generative-websites-reason');
      const moves = [];
      const moveActions = element('span', undefined, 'generative-websites-reorder');
      for (const [delta, label] of [[-1, 'earlier'], [1, 'later']]) {
        const move = button(`Move ${label}`);
        move.setAttribute('aria-label', `Move ${objects.get(step.id).label} ${label}`);
        move.dataset.moveId = step.id;
        move.dataset.moveDelta = String(delta);
        const allowed = permissions[index][label];
        move.disabled = !allowed;
        move.title = allowed ? 'Keep the selected goal, concepts and prerequisite choices.' : 'This move would break prerequisite order or move the goal before its preparation.';
        moves.push({node: move, allowed});
        moveActions.append(move);
      }
      routeLinks.push({id: step.id, link, moves});
      link.dataset.routeIndex = String(index);
      item.append(link, reason, moveActions);
      routeList.append(item);
    }
    updatePosition();
  };
  const makeRoute = () => {
    if (excursions.depth) return;
    actionEpoch++;
    try {
      const result = planRoute(catalog, {goal: goal.select.value, known: knownValues()});
      if (!result.ok) {
        route = null;
        activeObject = null;
        restoreViews();
        exportRoute.disabled = true;
        status.textContent = `Route unavailable: ${issueText(result.issues)} All authored views remain available. Select another goal or revise your starting knowledge.`;
        renderRoute();
        return;
      }
      route = result;
      cursor = 0;
      level = expertise.select.value;
      activeObject = route.steps[0]?.id || route.goal;
      renderRoute();
      applyLevel();
      exportRoute.disabled = false;
      status.textContent = `Route built for ${objects.get(route.goal).label}: ${route.steps.length} reviewed ${route.steps.length === 1 ? 'object' : 'objects'}. Changes to the goal or starting knowledge take effect when you build another route.`;
    } catch (error) {
      route = null;
      activeObject = null;
      restoreViews();
      exportRoute.disabled = true;
      status.textContent = `Route unavailable: ${error.message} All authored views remain available.`;
      renderRoute();
    }
  };
  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    actionEpoch++;
    controller.abort();
    restoreViews();
    visibility.dispose();
    for (const {bar} of returnBars.values()) bar.remove();
    for (const [node, tabindex] of initialTabIndices) {
      if (tabindex === null) node.removeAttribute('tabindex');
      else node.setAttribute('tabindex', tabindex);
    }
    for (const url of downloadURLs) URL.revokeObjectURL(url);
    downloadURLs.clear();
    for (const timer of downloadTimers) clearTimeout(timer);
    downloadTimers.clear();
    slot.replaceChildren(...previousChildren);
    slot.hidden = previousHidden;
    mounted.delete(panel);
  };
  mounted.set(panel, cleanup);
  listen(window, 'pagehide', cleanup);
  listen(window, 'hashchange', () => followNativeFragment(window.location.hash, true));
  // Reveal hidden destinations before the browser performs ordinary anchor scrolling.
  // A repeated click on the current hash produces no hashchange event, hence this hook.
  panel.ownerDocument.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    const anchor = event.target.closest?.('a[href]');
    if (!anchor || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return;
    const hash = samePageFragment(anchor.getAttribute('href'), window.location.href);
    if (hash) followNativeFragment(hash);
  }, {signal: controller.signal});
  listen(controls, 'submit', event => {event.preventDefault(); makeRoute();});
  listen(controls, 'change', event => {if (event.target !== importRoute) actionEpoch++;});
  listen(routeList, 'click', event => {
    const move = event.target.closest?.('button[data-move-id]');
    if (move && route && !excursions.depth && !move.disabled) {
      const id = move.dataset.moveId;
      const ids = route.steps.map(step => step.id);
      const index = ids.indexOf(id), target = index + Number(move.dataset.moveDelta);
      [ids[index], ids[target]] = [ids[target], ids[index]];
      try {
        const updated = reorderRoute(catalog, route, ids);
        actionEpoch++;
        route = updated;
        cursor = ids.indexOf(activeObject);
        if (cursor < 0) cursor = 0;
        renderRoute(); applyLevel();
        const restored = routeLinks.find(item => item.id === id)?.moves.find(item => item.node.dataset.moveDelta === move.dataset.moveDelta)?.node;
        if (restored && !restored.disabled) restored.focus({preventScroll: true});
        else routeLinks.find(item => item.id === id)?.link.focus({preventScroll: true});
        status.textContent = 'Route reordered. Its selected concepts, prerequisite choices and current concept are unchanged.';
      } catch (error) {status.textContent = `Route unchanged: ${error.message}`;}
      return;
    }
    const link = event.target.closest?.('a[data-route-index]');
    if (!link || !routeList.contains(link)) return;
    // Native hrefs remain useful when the enhancement has been removed.
    event.preventDefault();
    if (excursions.depth) {
      status.textContent = 'Return from concept exploration before moving to another route step.';
      return;
    }
    selectStep(Number(link.dataset.routeIndex));
  });
  listen(expertise.select, 'change', () => {
    level = expertise.select.value;
    if (route) applyLevel();
    status.textContent = route
      ? `Reviewed ${level} views selected. The route and its prerequisites are unchanged.`
      : `Reviewed ${level} level selected for the next valid route. All authored views remain available until then.`;
  });
  listen(previous, 'click', () => selectStep(cursor - 1));
  listen(next, 'click', () => selectStep(cursor + 1));
  listen(explore, 'click', () => {
    if (!route) {
      status.textContent = 'Build a valid route before opening a concept exploration. All authored views remain available below.';
      return;
    }
    const savedVisibility = visibility.capture();
    try {
      if (excursions.depth >= MAX_EXCURSIONS) throw new RangeError(`At most ${MAX_EXCURSIONS} nested concept explorations can be open. Return before opening another.`);
      const revealed = visibility.reveal(native.get(exploreChoice.select.value).views.get(level));
      if (!revealed.ok) {status.textContent = revealed.message; return;}
      excursions.push({
        cursor, activeObject, level, goal: goal.select.value, known: knownValues(),
        explore: exploreChoice.select.value, focus: document.activeElement,
        x: window.scrollX, y: window.scrollY, visibility: savedVisibility
      });
    } catch (error) {
      visibility.restore(savedVisibility);
      status.textContent = error.message;
      return;
    }
    actionEpoch++;
    activeObject = exploreChoice.select.value;
    updatePosition();
    if (focusObject(activeObject)) status.textContent = `Exploring ${objects.get(activeObject).label}. Return restores your previous position and selections.`;
  });
  const returnFromExploration = () => {
    const saved = excursions.pop();
    if (!saved) return;
    actionEpoch++;
    cursor = saved.cursor;
    activeObject = saved.activeObject;
    level = saved.level;
    goal.select.value = saved.goal;
    expertise.select.value = saved.level;
    const known = new Set(saved.known);
    for (const [id, input] of knownInputs) input.checked = known.has(id);
    exploreChoice.select.value = saved.explore;
    applyLevel();
    visibility.restore(saved.visibility);
    updatePosition();
    if (saved.focus?.isConnected && typeof saved.focus.focus === 'function') saved.focus.focus({preventScroll: true});
    window.scrollTo({left: saved.x, top: saved.y, behavior: 'instant'});
    status.textContent = excursions.depth ? `Returned to exploration of ${objects.get(activeObject).label}.` : 'Returned to your learning route. Previous position and selections restored.';
  };
  listen(back, 'click', returnFromExploration);
  for (const {returnButton} of returnBars.values()) listen(returnButton, 'click', returnFromExploration);
  listen(reset, 'click', () => {
    actionEpoch++;
    excursions.clear();
    route = null;
    cursor = 0;
    activeObject = null;
    level = catalog.defaultLevel;
    goal.select.value = catalog.defaultGoal;
    expertise.select.value = catalog.defaultLevel;
    exploreChoice.select.value = catalog.objects[0].id;
    for (const input of knownInputs.values()) input.checked = false;
    restoreViews();
    visibility.reset();
    importRoute.value = '';
    exportRoute.disabled = true;
    renderRoute();
    status.textContent = 'Route controls reset to the authored defaults and all authored views restored. Build a route to select a reviewed level again. No reader state is stored between visits.';
  });
  listen(exportRoute, 'click', () => {
    if (!route || excursions.depth) return;
    try {
    const data = createRouteRecord(catalog, route, {level, cursor});
    const url = URL.createObjectURL(new Blob([JSON.stringify(data)], {type: 'application/json'}));
    downloadURLs.add(url);
    const link = element('a');
    link.href = url;
    link.download = 'learning-route.json';
    link.hidden = true;
    slot.append(link);
    link.click();
    link.remove();
    const timer = setTimeout(() => {
      URL.revokeObjectURL(url); downloadURLs.delete(url); downloadTimers.delete(timer);
    }, 60000);
    downloadTimers.add(timer);
    status.textContent = 'Route download requested with its snapshot, current step and selected revisions. The file contains route settings, not reviewed content.';
    } catch (error) {status.textContent = `Route download unavailable; your route is unchanged. ${error.message}`;}
  });
  listen(importRoute, 'change', async () => {
    const file = importRoute.files?.[0];
    if (!file || excursions.depth) return;
    const epoch = ++actionEpoch;
    try {
      if (file.size > MAX_ROUTE_RECORD_BYTES) throw new RangeError(`Route JSON must not exceed ${MAX_ROUTE_RECORD_BYTES} bytes.`);
      const text = await file.text();
      if (disposed || excursions.depth || epoch !== actionEpoch) return;
      const restored = parseRouteRecord(catalog, text);
      route = restored.route; cursor = restored.cursor; level = restored.level;
      activeObject = route.steps[cursor].id;
      goal.select.value = route.goal; expertise.select.value = level;
      const known = new Set(route.known);
      for (const [id, input] of knownInputs) input.checked = known.has(id);
      renderRoute(); applyLevel();
      status.textContent = 'Saved route restored against this exact reviewed snapshot. No file was uploaded. Select a step to continue.';
    } catch (error) {if (!disposed && epoch === actionEpoch) status.textContent = `Saved route refused; your current route is unchanged. ${error.message}`;}
    finally {if (!disposed && epoch === actionEpoch) importRoute.value = '';}
  });
  let printing = false, printViews;
  const printStart = () => {
    if (printing || disposed) return;
    printing = true;
    printViews = new Map([...initialViews.keys()].map(view => [view, view.hidden]));
    restoreViews(); visibility.printStart();
  };
  const printEnd = () => {
    if (!printing) return;
    visibility.printEnd();
    for (const [view, hidden] of printViews) view.hidden = hidden;
    printing = false;
  };
  listen(window, 'beforeprint', printStart);
  listen(window, 'afterprint', printEnd);
  if (typeof window.matchMedia === 'function') listen(window.matchMedia('print'), 'change', event => event.matches ? printStart() : printEnd());
  // Building the authored default never moves the reader's focus or scroll position.
  makeRoute();
  // A deep link is an explicit native navigation choice, independent of route planning.
  followNativeFragment(window.location.hash, true);
  return cleanup;
}

function boot() {
  for (const panel of document.querySelectorAll('.generative-route')) enhance(panel);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once: true});
  else boot();
  // pagehide restores native content; pageshow also handles the back/forward cache.
  window.addEventListener('pageshow', boot);
}

return {MAX_EXCURSIONS,createExcursionStack,resolveNativeViews,resolveNativeFragment,samePageFragment,enhance};
})();

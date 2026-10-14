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
    if (typeof key !== "string" || !fields.includes(key)) fail(path, "unknown field; remove unsupported keys and use the documented field allowlist");
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
export function validateCatalog(catalog) {
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
export function planRoute(catalog, options = {}) {
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
  if (!goalObject) return failure([issue("unavailable-goal", "The selected goal is unavailable; choose an object from this reviewed catalogue.", "options.goal")]);

  const knownIssues = [];
  for (const id of known) {
    const object = objects.get(id);
    if (!object) knownIssues.push(issue("unavailable-known", "The selected known object is unavailable; choose an object from this reviewed catalogue.", "options.known"));
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

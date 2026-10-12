// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
import {validateCatalog, planRoute} from './route.js';

const mounted = new WeakMap();
export const MAX_EXCURSIONS = 64;

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
export function createExcursionStack() {
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
export function resolveNativeViews(catalog, doc = document) {
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

/** Resolve only fragments inside this validated catalogue's native views. */
export function resolveNativeFragment(hash, native, doc = document) {
  if (typeof hash !== 'string' || !hash.startsWith('#') || hash.length === 1) return null;
  let id;
  try {id = decodeURIComponent(hash.slice(1));} catch {return null;}
  const target = doc.getElementById(id);
  const owner = target?.closest?.('.learning-view');
  if (!owner) return null;
  for (const {views} of native.values()) {
    for (const [level, view] of views) if (view === owner) return {target, level};
  }
  return null;
}

/** Ignore anchors to other pages, queries, origins and non-fragment resources. */
export function samePageFragment(href, currentURL) {
  try {
    const current = new URL(currentURL);
    const target = new URL(href, current);
    return target.origin === current.origin && target.pathname === current.pathname &&
      target.search === current.search && target.hash ? target.hash : null;
  } catch {return null;}
}

/** Mount one page-local, network-free route controller. Returns an idempotent cleanup. */
export function enhance(panel) {
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
  const actions = element('div', undefined, 'generative-websites-actions');
  actions.append(build, reset, exportRoute);
  controls.append(goal.label, expertise.label, knownField, actions);

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
  const excursions = createExcursionStack();
  let routeLinks = [];
  const downloadURLs = new Set();
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
    if (level !== fragment.level) {
      level = fragment.level;
      expertise.select.value = level;
      if (route) applyLevel();
      status.textContent = route
        ? `Native link selected reviewed ${level} views. Your route and its prerequisites are unchanged.`
        : `Native link selected the reviewed ${level} level. All authored views remain available until you build a route.`;
    }
    // Initial fragment navigation can have occurred while its target was hidden.
    // Reveal and scroll to the native target without moving reader focus.
    if (scroll) fragment.target.scrollIntoView({block: 'start', behavior: 'instant'});
  };
  const focusObject = id => {
    const item = native.get(id);
    if (!item) return;
    if (!item.node.hasAttribute('tabindex')) item.node.tabIndex = -1;
    item.node.focus({preventScroll: true});
    item.node.scrollIntoView({block: 'start', behavior: 'instant'});
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
    for (const {link} of routeLinks) {
      if (excursions.depth) link.setAttribute('aria-disabled', 'true');
      else link.removeAttribute('aria-disabled');
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
    cursor = index;
    activeObject = route.steps[index].id;
    updatePosition();
    if (moveFocus) focusObject(activeObject);
  };
  const renderRoute = () => {
    routeList.replaceChildren();
    routeLinks = [];
    if (route) for (const [index, step] of route.steps.entries()) {
      const item = element('li');
      const link = element('a', objects.get(step.id).label);
      const reason = element('span', ` — ${step.reason}`, 'generative-websites-reason');
      routeLinks.push({id: step.id, link});
      link.dataset.routeIndex = String(index);
      item.append(link, reason);
      routeList.append(item);
    }
    updatePosition();
  };
  const makeRoute = () => {
    if (excursions.depth) return;
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
    controller.abort();
    restoreViews();
    for (const [node, tabindex] of initialTabIndices) {
      if (tabindex === null) node.removeAttribute('tabindex');
      else node.setAttribute('tabindex', tabindex);
    }
    for (const url of downloadURLs) URL.revokeObjectURL(url);
    downloadURLs.clear();
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
  listen(routeList, 'click', event => {
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
    try {
      excursions.push({
        cursor, activeObject, level, goal: goal.select.value, known: knownValues(),
        explore: exploreChoice.select.value, focus: document.activeElement,
        x: window.scrollX, y: window.scrollY
      });
    } catch (error) {
      status.textContent = error.message;
      return;
    }
    activeObject = exploreChoice.select.value;
    updatePosition();
    focusObject(activeObject);
    status.textContent = `Exploring ${objects.get(activeObject).label}. Return restores your previous position and selections.`;
  });
  listen(back, 'click', () => {
    const saved = excursions.pop();
    if (!saved) return;
    cursor = saved.cursor;
    activeObject = saved.activeObject;
    level = saved.level;
    goal.select.value = saved.goal;
    expertise.select.value = saved.level;
    const known = new Set(saved.known);
    for (const [id, input] of knownInputs) input.checked = known.has(id);
    exploreChoice.select.value = saved.explore;
    applyLevel();
    updatePosition();
    if (saved.focus?.isConnected && typeof saved.focus.focus === 'function') saved.focus.focus({preventScroll: true});
    window.scrollTo({left: saved.x, top: saved.y, behavior: 'instant'});
    status.textContent = excursions.depth ? `Returned to exploration of ${objects.get(activeObject).label}.` : 'Returned to your learning route. Previous position and selections restored.';
  });
  listen(reset, 'click', () => {
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
    exportRoute.disabled = true;
    renderRoute();
    status.textContent = 'Route controls reset to the authored defaults and all authored views restored. Build a route to select a reviewed level again. No reader state is stored between visits.';
  });
  listen(exportRoute, 'click', () => {
    if (!route) return;
    const data = {
      version: 0, language: catalog.language, snapshot: catalog.snapshot,
      goal: route.goal, known: route.known, level,
      steps: route.steps, choices: route.choices,
      revisions: route.steps.map(step => {
        const object = objects.get(step.id);
        const view = object.views.find(view => view.level === level);
        return {id: object.id, revision: object.revision, view: {level, revision: view.revision, digest: view.digest}};
      })
    };
    const url = URL.createObjectURL(new Blob([`${JSON.stringify(data, null, 2)}\n`], {type: 'application/json'}));
    downloadURLs.add(url);
    const link = element('a');
    link.href = url;
    link.download = 'learning-route.json';
    link.hidden = true;
    slot.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    downloadURLs.delete(url);
    status.textContent = 'Route downloaded with its content snapshot and selected revisions. This file does not include the reviewed content itself.';
  });
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

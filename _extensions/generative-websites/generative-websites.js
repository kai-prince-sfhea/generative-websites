// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
import {validateCatalog, planRoute} from './route.js';
import {createRouteRecord, parseRouteRecord, reorderRoute, MAX_ROUTE_RECORD_BYTES} from './session.js';
import {createVisibilityManager} from './navigation.js';

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

/** Resolve fragments in validated views or their object's common native content. */
export function resolveNativeFragment(hash, native, doc = document) {
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
    for (const {id, bar} of [...returnBars].map(([id, value]) => ({id, ...value}))) bar.hidden = excursions.depth === 0 || id !== activeObject;
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
        let allowed = false;
        const target = index + delta;
        if (target >= 0 && target < route.steps.length) {
          const ids = route.steps.map(item => item.id);
          [ids[index], ids[target]] = [ids[target], ids[index]];
          try {reorderRoute(catalog, route, ids); allowed = true;} catch { /* Dependencies stay in order. */ }
        }
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

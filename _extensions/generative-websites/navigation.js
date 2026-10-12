// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0

const isDetails = node => node?.localName === 'details';
const isCollapse = node => node?.classList?.contains('collapse') || node?.classList?.contains('collapsing');
const isDisclosure = node => isDetails(node) || isCollapse(node);
const ancestry = target => {
  const nodes = [];
  for (let node = target; node; node = node.parentElement) nodes.push(node);
  return nodes;
};
const concealed = node => node.hidden || node.getAttribute('aria-hidden')?.toLowerCase() === 'true';

/**
 * Reveal native destinations without changing authored hidden/privacy boundaries.
 * Only native details and Bootstrap collapse state are managed. The caller owns
 * reviewed-view selection, focus, scrolling and print labels. Snapshots are
 * opaque, page-local values; they contain no serializable reader information.
 */
export function createVisibilityManager(native, doc = document) {
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
        message: 'This destination is inside authored hidden content. Choose another reviewed view or make that content visible using its author-provided control.'
      };
      const relevant = nodes.filter(node => disclosures.has(node));
      if (relevant.some(node => node.classList.contains('collapsing'))) return {
        ok: false, message: 'A native callout is still opening or closing. Try this destination again when the transition finishes.'
      };
      open(relevant);
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

# Generative Websites

Compose learning routes from explicitly reviewed Quarto content. This experimental
**0.0.3 / GW-0** implementation keeps authored prose and mathematics in native fenced
Divs, offers introductory/advanced views, and orders pedagogical prerequisites
without a language model. This is experimental local source; it is not a supported
release or a claim of educational benefit. The bounded GW-0 development milestone
is separate from the wider research roadmap and your acceptance of the extension.

## Try the local example

Requires Quarto 1.11.5 or newer. Initial verification uses **1.11.5 pre-release on
Windows**; the minimum-version declaration does not verify other versions/platforms.
No Node.js, model, SDK or project hooks are needed to use the extension.

From this source folder:

```powershell
quarto render example.qmd
quarto render example.qmd --to docx
```

For a separate consumer folder beside `generative-websites`, install locally:

```powershell
quarto add ../generative-websites --no-prompt
quarto list extensions
```

Copy `example.qmd` into the consumer and render it. Its activation is:

```yaml
filters:
  - generative-websites
```

This is the verified **local** namespace. There is no public GitHub installation
route yet. Files under `_extensions/generative-websites` form the complete installed
runtime. It uses Quarto's [filter manifest and activation](https://quarto.org/docs/extensions/filters.html)
and [HTML dependency API](https://quarto.org/docs/extensions/lua-api.html#dependencies).

## Author learning objects

Use a native ID for each occurrence and a scoped URI for the concept it discusses.
Review and revisions are explicit author declarations; the extension cannot
establish mathematical truth or equivalence between two explanations. `context`
is an author-controlled compatibility label; matching labels are not proof of
compatible assumptions. Keep the assumptions and qualifications in the prose.

```markdown
:::: {#sets .learning-object concept-id="urn:example:concept:sets" revision="sets-1" label="Sets" context="elementary-maths" review="author-reviewed" reviewed-by="Your name"}
## Sets {#sets-title}

::: {.learning-view level="introductory" revision="sets-intro-1" review="author-reviewed" reviewed-by="Your name"}
A set is a collection of objects.
:::

::: {.learning-view level="advanced" revision="sets-advanced-1" review="author-reviewed" reviewed-by="Your name"}
State the reviewed advanced explanation and its assumptions here.
:::
::::
```

Each selected object requires exactly one **direct child** view of each level.
The extension supplies view anchors such as `sets--introductory`; do not author
view IDs. IDs start with an ASCII letter, contain letters/digits/`._:-`, and
are at most 128 bytes. Concept IDs identify a scoped concept, not an automatic
equivalence assertion. Update object/view revisions after editorial changes.
Keep heading IDs distinct from object IDs, as `sets-title` above; native automatic
heading IDs can otherwise collide with a Div of the same name. Objects and route
panels cannot be nested inside each other.
Content digests also change the page snapshot if a revision is accidentally reused.
Digests identify rendered content; they are not cryptographic signatures or a
historical revision store.

An object with `review="candidate"` remains ordinary native content and is
excluded from route composition. A candidate's visibility is still governed by
Quarto. This extension is **not a privacy filter**: all authored visible content,
including candidates and both expertise views, is delivered to the reader.
Do not place confidential content in a public page or enable native source
downloads without reviewing their contents. No review is inferred from styling,
successful rendering or an AI suggestion.

## Author a learning activity

Put the observable objective, task and shared assumptions in ordinary Markdown
inside the object, outside its two views. Use the views to offer different
explanations of that same task. Native Quarto callouts can provide ordered hints
and a labelled, explained solution. The example leaves their bodies open so they
remain readable without JavaScript or disclosure controls. Native collapsed
callouts need their own keyboard and no-JavaScript checks before use; the tested
Quarto version's default collapsed headers did not provide those behaviours.
Include a transfer question or counterexample that exposes a plausible
misconception. See the complete bijections activity in [example.qmd](example.qmd).
These are authoring conventions, not additional required configuration or a
grading engine; update the object revision when shared content changes.

Invite readers to try a question before requesting help, and let them choose
their support. Solutions are delivered with the page: search, native
source, print, Word and ePub can expose them. They do not protect assessment
answers. A visit, level choice or revealed solution does not demonstrate mastery.
The starting-knowledge choices are self-reported preparation, and the extension
does not infer ability or mark an answer correct. No learner response is collected.

Keep source, creator, licence and adaptation notes visible with reused material.
The synthetic example is original Apache-2.0 source with material Codex
assistance; its review fields demonstrate syntax rather than independent
validation. Your teaching content and each reused component need their own
rights decision. Downloaded route JSON contains settings, not an editable OER
corpus or a verified record of achievement. Structured pedagogical metadata,
reviewed interest variants, portable OER bundles and external activity adapters
remain separate planned work.

## Declare preparation and add controls

Prerequisites are pedagogical preparation, distinct from mathematical proof
dependence or thematic similarity. Put them in document or project metadata:

```yaml
generative-websites:
  prerequisites:
    functions: sets
    bijections:
      all:
        - functions
        - any:
            - proofs
            - logic
```

A string names another native object ID. `all` requires every member; `any`
selects the **first feasible alternative in authored order**. Groups may nest.
A leaf object needs no entry. Missing/unreviewed targets, cycles and incompatible
contexts block the affected branch. An unavailable alternative does not prevent
a different feasible OR branch. The policy is deterministic; it does not claim
shortest paths, optimal difficulty or verification of the author's dependencies.
A project-wide map may describe several pages. Every entry is structurally
validated; an owner absent or unreviewed on the current page produces a warning
and is not bound to that page's catalogue. Check these warnings for misspelled
IDs. A reference from a selected object to an unavailable target still blocks
that branch. Routes do not traverse objects on other pages in GW-0.

The prerequisite example and `bijections` goal below use all four objects in
`example.qmd`. For a page containing only the `sets` object above, omit that
prerequisite map and use `goal="sets"`.

Add one panel per page:

```markdown
::: {.generative-route goal="bijections" level="introductory"}
## Choose a learning route
:::
```

The goal defaults to the first selected object; level defaults to introductory.
Only `lang: en` is supported in GW-0. A page without the panel receives no
extension browser assets. Unknown configuration keys and malformed annotations
produce actionable render errors. Limits are 50 objects, 512 prerequisite
expression nodes, depth 16, and 20,000 object visits per route search.

The installed [configuration reference schema](_extensions/generative-websites/config-v1.schema.json)
describes the **value of `generative-websites` metadata**, using JSON Schema
Draft 2020-12. A compatible validator can check its structure after YAML-to-JSON
conversion. It is not automatically registered with Quarto or your editor.
Runtime validation also checks total expression count/depth, byte limits, page
binding and available reviewed content; passing the schema does not establish
those checks or the correctness of authored prerequisites.

Readers choose a goal, mark starting knowledge, build a route, inspect each
item's reason, move between steps and switch reviewed levels. Move earlier/later
buttons allow independent steps to be reordered while retaining prerequisite
order, the selected OR alternatives and the goal at the end. Known prerequisites
skip their own preparation subgraphs; the selected goal and its prerequisites
are still planned even when the goal is marked known. Exploring
another concept pauses the route. Nested return restores the enclosing step,
level, draft controls, native disclosure state, focus and scroll position.
An in-content Return to saved position button avoids travelling to the panel
to leave an exploration. Reset restores all native
views. State stays in page memory and disappears on navigation/reload; no learner
account, diagnosis, telemetry or browser storage is required.

Download route JSON records the fixed snapshot, selected revisions, route order,
starting knowledge, level and current step. Restore a saved route reads that file
locally, replans from the current catalogue and rejects stale revisions, changed
branches, broken prerequisite order or malformed data without replacing the
working route. The version-1 file is bounded to 256 KiB and contains no source
corpus. It can contain personally meaningful goals and self-reported knowledge;
review it before sharing. Files are never uploaded or stored by the extension.
Save or restore after returning from any open exploration.

Both authored views and a default ordered route remain in native HTML/Word/ePub
without JavaScript. Native links and route steps reveal relevant closed details
and Quarto callouts; explicit authored hidden boundaries are respected. Route
navigation refuses destinations concealed by an inactive native tab, author
styles or `inert`, and leaves the current route position and disclosure state
unchanged. Use the page's author-provided control to reveal the destination,
then retry. Native tabs are not activated automatically. Printing
temporarily exposes both labelled views and restores the reader's view and
disclosure selections afterwards. If route construction fails,
the prose remains available with the reason. External assets already requested
by your Quarto format, such as its default math renderer, remain that format's
configuration; this extension makes no remote API/model requests. Its packaged
JavaScript/CSS are served by your site.

The delivered browser entry is assembled from the original modules during
development, so `embed-resources: true` can embed it without unresolved relative
imports. No build tooling is needed by authors. Quarto's other resources remain
governed by its format options; an embedded extension entry alone does not prove
that an entire website works offline. Preview or a web server is the usual way
to view interactive output.

## Disable, update or remove

```yaml
generative-websites:
  enabled: false
```

Deactivation bypasses stale extension settings and preserves native content.
For a local consumer:

```powershell
quarto update ../generative-websites --no-prompt
quarto remove generative-websites --no-prompt
```

After removal, remove the filter from your YAML before rendering. Your prose,
links and fenced Divs remain native Quarto source. There are no caches to clear.

## Current boundaries and rights

| Verified scope on this host | Boundary |
|---|---|
| Windows; Quarto 1.11.5 pre-release | Other versions/platforms remain unverified. |
| Document and website HTML; nested pages; native preview/watch | Normal metadata layers, existing hooks, theme and includes are preserved in the recorded fixtures. |
| HTML with `embed-resources: true` | Browser entry executes after Quarto transforms/embeds it; whole-site offline/CSP acceptance is separate. |
| Word and ePub | Static route and both labelled views; no interactive controls. |
| Unicode prose/labels; spaces and Latin-1 input filenames | ASCII object IDs are required. A CJK consumer-directory path hit an independently reproduced native filter-loader encoding failure on this host. |
| Page memory plus explicit local route files | No persistent learner profile, account or automatic storage; route v0 exports from 0.0.1 are unsupported. |

The configuration and route-file APIs remain experimental. Version-1 restoration
requires the exact snapshot; re-rendered changes may require a newly built route.
This is intentional stale-content refusal, not a route migration service.

This first slice is page-local and deterministic. Cross-page graph adapters,
reviewed replaceable spans, translation, AI proposals, Sandbox interchange,
progressive/PWA delivery, reusable OER bundles and daily/weekly reporting remain
planned. No dependency on the other extensions is declared until actual
integration has been implemented and tested. Static source pages are available
to crawlers; no indexing/ranking or learner-outcome claim follows.

Native render and algorithm tests establish only their named cases. Independent
author/mathematical review, manual keyboard/screen-reader acceptance, educational
evaluation and deployment remain open. Developer fixtures and evidence live in
the separate sibling `generative-websites-development` workspace and are not
installed. The example's review fields are synthetic demonstrations, not signed
human acceptance records.

Original source is licensed under [Apache 2.0](LICENSE), with installed notices
retained. Content authored using the extension has its own rights; using this
software does not make that content FAIR, OER or openly licensed. No model,
third-party runtime library or Argumentation Sandbox source is bundled.

**AI transparency:** OpenAI Codex materially assisted the research interpretation,
architecture, source, tests, expected-result design and documentation. Tests
written with the implementation are not independent semantic or accessibility
evaluation. No AI inference runs while rendering or using GW-0, and AI assistance
does not imply University of Manchester approval or replace applicable human
review and Responsible AI guidance.

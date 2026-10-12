# Generative Websites

Compose learning routes from explicitly reviewed Quarto content. This experimental
**0.0.1 / GW-0** prototype keeps authored prose and mathematics in native fenced
Divs, offers introductory/advanced views, and orders pedagogical prerequisites
without a language model. Development has started locally; it is not a supported
release or a claim of educational benefit.

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
An unknown prerequisite owner is a configuration error.

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

Readers choose a goal, mark starting knowledge, build a route, inspect each
item's reason, move between steps and switch reviewed levels. Known prerequisites
skip their own preparation subgraphs; the selected goal and its prerequisites
are still planned even when the goal is marked known. Exploring
another concept pauses the route. Nested return restores the enclosing step,
level, draft controls, focus and scroll position. Reset restores all native
views. State stays in page memory and disappears on navigation/reload; no learner
account, diagnosis, telemetry or browser storage is required.

Download route JSON records the fixed snapshot, selected revisions, route and
starting knowledge. It is a local reader download, contains no source corpus,
and cannot currently be re-imported. Both authored views and a default ordered
route remain in native HTML/Word without JavaScript. If route construction fails,
the prose remains available with the reason. External assets already requested
by your Quarto format, such as its default math renderer, remain that format's
configuration; this extension makes no remote API/model requests. Its packaged
JavaScript/CSS are served by your site.

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

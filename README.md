# Generative Websites

Compose learning routes from explicitly reviewed Quarto content. This experimental
**0.0.12** implementation keeps authored prose and mathematics in native fenced
Divs, adds independent reviewed exposition/wording/scaffolding choices, finite
practice, explicit cross-page routes and public publication tools without a
language model. The earlier two-view/page-local route remains supported.
This is experimental source; it is not a supported
release or a claim of educational benefit. The bounded GW-0 development milestone
is separate from the wider research roadmap and your acceptance of the extension.
It is intended for authors of teaching and research pages who want readers to
choose reviewed explanations and explore preparation without losing their route.

Version 0.0.12 is development source distributed from the experimental `main`
branch. The GitHub and local-source instructions below provide alternative
installation routes. Use matching companion versions and retain the documented
verification limits; source publication does not establish a supported release.

Current 0.0.12 adds bounded native structure and protected landmarks to explicit local translation requests, and a separate font-notice supplement for an exact supported local Numbas font selection. Source/candidate review remains explicit. Current native and bounded model checks are recorded below with their meaning, human-review and rights qualifications; older verification sections retain their original scopes.

## Start with one learning object

The runnable [example.qmd](example.qmd) is the tutorial: render it, choose reviewed
alternatives, change one YAML default and render again with native Preview.
No model, prerequisite catalogue or author-written JavaScript is needed. This
README provides the advanced configuration and integration reference; the
separate [advanced.qmd](advanced.qmd) demonstrates a multi-object activity.

## Install from GitHub

Requires Quarto 1.11.5 or newer. Initial verification uses **1.11.5 pre-release on
Windows**; the minimum-version declaration does not verify other versions/platforms.
No Node.js, model, SDK or project hooks are needed to use the extension.

Install in a separate consumer folder, copy [example.qmd](example.qmd) there,
then render and follow the instructions in its output:

```powershell
quarto add kai-prince-sfhea/generative-websites --no-prompt
quarto list extensions
quarto render example.qmd
quarto preview example.qmd
```

Your editor's Render/Preview controls can perform the same routine work. For
a checkout or extracted source, use the [local source alternative](#local-source-alternative).
The example contains synthetic review declarations, not independent approval.

Both supplied pages activate the GitHub installation namespace:

```yaml
filters:
  - kai-prince-sfhea/generative-websites
```

The default installation follows the experimental `main` branch; no supported
tagged release is promised. Files below `_extensions` form the complete installed
runtime. GitHub installation places them in
`_extensions/kai-prince-sfhea/generative-websites`. It uses Quarto's
[filter manifest and activation](https://quarto.org/docs/extensions/filters.html)
and [HTML dependency API](https://quarto.org/docs/extensions/lua-api.html#dependencies).

### Local source alternative

For a consumer folder beside a checkout named `generative-websites`, install locally:

```powershell
quarto add ../generative-websites --no-prompt
quarto list extensions
```

Copy `example.qmd` into the consumer and change its filter selector to the local
namespace before rendering:

```yaml
filters:
  - generative-websites
```

Render `example.qmd` and follow its tutorial. To explore prerequisites afterwards,
copy `advanced.qmd` too and make the same selector change before rendering it.

The same selector change is required to render the example directly from a
source checkout. Local installation uses `_extensions/generative-websites`;
the remaining consumer instructions use the GitHub namespace.

## Customise your content and controls

The additive tutorial uses `.adaptive-object`, `.learning-variant` and
`.learning-preferences`; see the next section for their advanced options.
The following table describes the retained legacy two-view interface in
`advanced.qmd`. Start with its native Markdown. Keep the
four-colon outer fence and its two direct three-colon `.learning-view` children.
Shared tasks and assumptions belong outside the two views so switching levels
does not change the question being answered.

| Change you want | Where to edit |
|---|---|
| Object name shown in controls | Its `label` attribute and ordinary heading text |
| Introductory/advanced explanations | The two `.learning-view` Div bodies |
| Initial goal | Panel attribute `goal="sets"`; omit it to use the first reviewed object |
| Initial explanation level | Panel attribute `level="advanced"`; omitted means `introductory` |
| Panel title and introduction | Ordinary Markdown inside `.generative-route` |
| Manual preparation | `generative-websites.prerequisites` in project or page YAML |
| Graph preparation source | `graph-prerequisites: website` (default), another graph ID, or `false` |
| Automatic Local AI source excerpts | `local-ai-sources: true` (default); set `false` for manual selection |
| Disable this page | `generative-websites: {enabled: false}` in its effective YAML |

Keep the native `#sets` ID and `concept-id` stable while changing visible labels.
When creating another object, give it its own native ID and scoped concept URI;
you can mint a URI such as `urn:my-course:concept:functions` without running a
server. Use a declared shared-catalogue prefix or HTTP(S)/URN identity for
graph-linked concepts. Copying a label is not enough to establish equivalence.
Keep heading IDs distinct from object IDs, for example `#sets-title`.

Check both views before declaring them reviewed. Replace each example
`reviewed-by` value with the actual reviewer; use `review="candidate"` on an
object that is still being drafted. A candidate remains visible as native
content but is excluded from routes. After editing, update the affected view's
`revision` and the object's `revision`; update the object revision for changed
shared tasks, assumptions or qualifications. Saved routes intentionally refuse
changed snapshots. Review markers are declarations, not a review service.

Quarto theme settings provide the default typography and colours. Optional CSS
can target `.generative-websites-enhancement` (controls), `.learning-object`
(shared task and views) and `.learning-view` (an explanation). For example, add
`format: {html: {css: styles.css}}` to your existing YAML, then use:

```css
.generative-websites-enhancement {
  border-radius: .75rem;
  padding: 1.25rem;
}
```

QMD/YAML are sufficient without this optional stylesheet. Keep the extension's
hidden-state and print rules, visible focus indicators and labelled explanation
levels intact; check any custom theme at narrow widths and in light/dark modes.
The CSS selectors are styling hooks, not a separate JavaScript integration API.

## Reviewed adaptation and publication

Keep the common task, assumptions and qualifications outside the replaceable
groups. The browser selects existing native AST content; it does not inject HTML
or globally replace words. QMD/YAML and ordinary editor Render/Preview are enough.

```yaml
generative-websites:
  project:
    id: my-course
    revision: v1
    page-id: foundations
    page-revision: v1
    page-url: foundations.html
  defaults:
    exposition: introductory
    terminology: plain
    scaffolding: standard
```

Use the actual output filename for `page-url`; it must match HTML rendering and
identifies that public page when exporting Word/ePub. Alternatively supply its
exact mapping in `publication.pages`. Page IDs must be unique across selected
pages; a logical page ID can equal an object ID without duplicating an HTML ID.

```markdown
:::: {#sets .adaptive-object label="Sets" concept-id="urn:my-course:concept:sets" context="urn:my-course:context:sets" revision="v1" review="author-reviewed" reviewed-by="Your name"}
## Sets {#sets-title}

Keep the common task and qualifications here.

::: {.learning-variant group="explanation" axis="exposition" value="introductory" default="true" revision="intro-v1" review="author-reviewed" reviewed-by="Your name"}
An authored introductory explanation of the same task.
:::

::: {.learning-variant group="explanation" axis="exposition" value="advanced" revision="advanced-v1" review="author-reviewed" reviewed-by="Your name"}
An authored advanced explanation with the same assumptions.
:::
::::

::: {.learning-preferences}
### Choose an authored explanation
:::
```

Each group has one of the eight axes listed below. They vary
independently; selecting an advanced explanation does not infer knowledge, change
language/notation or remove a scaffold. `level` explicitly aliases exposition;
conflicting `level` and `exposition` settings are refused. Unsupported choices
keep that group's author default and report the limitation.

Each variant needs its own revision, explicit author review and reviewer.
Exactly one `default="true"` marks the group default; otherwise the first variant
is used. Group/value tokens use lowercase letters/digits/hyphens. Keep complete
attribute lists on one line. Generated anchors follow
`sets--explanation--introductory`; do not duplicate them elsewhere.

Literal wording may use `.learning-variant` Spans inside the object:

```markdown
**Wording:** [Plain: a collection.]{.learning-variant group="wording" axis="terminology" value="plain" default="true" revision="plain-v1" review="author-reviewed" reviewed-by="Your name"} [Technical: a set.]{.learning-variant group="wording" axis="terminology" value="technical" revision="technical-v1" review="author-reviewed" reviewed-by="Your name"}
```

Label the alternatives so the unenhanced page stays intelligible. Rich block
variants can retain native mathematics/citations; inline alternatives cannot
rewrite math, quotations, citations or code. Variants cannot nest inside one
another or protected assertion/invariant containers. Candidates and all visible
published variants remain native content: selection is not a privacy mechanism.
Word/ePub select declared axis defaults; unenhanced HTML keeps authored content.
HTML publication/source pins and language head links apply to actual HTML pages.
Word retains native object/assertion bindings and defaults; its format-specific
whole-page AST does not attest an HTML page snapshot. Language sets use Quarto's
effective website `site-url` where configured; no project YAML reader substitutes
for Quarto's configuration processing.

Optional theme hooks include `.adaptive-object`, `.learning-variant`,
`.generative-feature-controls`, `.generative-exercise` and
`.generative-period-report`. Preserve hidden-state rules, visible focus, labels
and narrow-screen layout. No styling JavaScript is needed.

### Eight independent authored choices

The supported axes are `exposition`, `terminology`, `scaffolding`,
`prerequisite-knowledge`, `reading-complexity`, `context-interest`,
`representation` and `challenge`. Each group selects one of its own reviewed
values; it does not infer a reader's ability, diagnosis, interests or mastery.
For example, a representation group can offer `words` and `table` while an
independent challenge group offers `worked` and `practice`. Labels and complete
alternatives remain authored native content. An unsupported choice retains that
group's author default and explains the limitation. A new axis does not generate
missing alternatives or change the common task, assumptions or qualifications.

```yaml
generative-websites:
  defaults:
    exposition: introductory
    terminology: plain
    scaffolding: standard
    prerequisite-knowledge: recap
    reading-complexity: concise
    context-interest: neutral
    representation: words
    challenge: worked
```

Only declare defaults whose alternatives you have authored. Use the same
`.learning-variant` syntax shown above with the corresponding `axis` and your
reviewed `value`; the controls offer choices present on that page. `level` remains
an explicit alias for `exposition`, with conflicting values refused.

### Structured activities and private reader progress

Keep the activity itself in QMD. YAML references its existing reviewed source
object and, optionally, one existing `exercise` or `sandbox` problem. Merge this
fragment into the existing `generative-websites` map; do not create a duplicate
top-level map. `source: sets` refers to the tutorial's object, not a file path.

```yaml
generative-websites:
  activities:
    - id: membership-activity
      revision: v1
      label: Explain membership
      public: true
      review: author-reviewed
      source: sets
      disclosure:
        hints: staged
        solution: reader-choice
        feedback: after-check
```

```markdown
:::: {.learning-activity #membership-activity}
::: {#membership-objective learning-role="objective"}
Explain one membership decision for the given set.
:::

::: {#membership-task learning-role="task"}
For $A=\{1,2\}$, explain whether $3$ belongs to $A$.
:::

::: {#membership-hint learning-role="hint"}
Compare $3$ with each listed element.
:::

::: {#membership-solution learning-role="solution"}
$3$ is not a listed member of $A$.
:::

::: {#membership-reflection learning-role="reflection-prompt"}
Which comparison helped you explain your decision?
:::
::::
```

An activity has one task, one to eight objectives, up to eight hints, optional solution/debrief,
up to four feedback parts and four reflection prompts. Each part needs a unique
native Div ID. Feedback uses `learning-role="feedback"` and
`learning-feedback="correct"`, `incorrect`, `invalid` or `unavailable`.
Definitions and actual visible parts must agree; private, hidden, conditional,
duplicate or unsupported part containers are refused. Use `hints: open`,
`solution: open` or `feedback: open` to keep those parts open in the enhanced
view. Unenhanced HTML, Word and print retain the delivered native material.
Hints and solutions are public content, so this is not secure assessment.

To connect an existing finite checker, add `exercise: fraction-practice` to the
activity declaration and keep the existing `exercises` declaration. The checker
is placed once after the task. Alternatively use `sandbox: conditional-argument`
to associate an existing problem export; it does not import an attempt or proof.
Supplying both associations is refused. With neither, completion is explicitly
self-reported and no answer is graded.

Readers explicitly record visits/attempts, request hints, choose self-completion
and save individual reflections. Those actions do not establish learning,
competence, mathematical proof or publication evidence. A local finite checker
reports only its bounded check. Pending reflection text is retained while using
other controls; **Save this reflection** commits that prompt to private memory.

Progress starts in memory. Export/import, device **Remember** consent, **Restore**,
**Stop remembering**, **Clear this scope's saved report** and **Reset** are
separate actions. Files and device storage can contain private reflections.
Imported outcomes remain unauthenticated reader reports, even after a later
local visit. Changed source, parts, practice or catalogue identities refuse an
old report and retain the previous usable report. Storage failures are labelled;
clearing one scope does not delete unrelated browser data. Progress is not sent
to Local AI, the knowledge graph, a CV or any server by this extension.

### Controlled statements and reviewed finite language realisations

Ordinary authored prose remains the default. This explicit optional grammar
compiles declared symbols into the existing typed assertion registry. It does
not interpret general prose, pronouns, synonyms or arbitrary mathematical TeX.
Start in `inspect` mode, render normally, then read the native **Controlled
authoring: current review bindings** section. It supplies copyable YAML using
the actual current source and typed-IR identities; no author script or invented
hashes are needed.

```yaml
generative-websites:
  assertions:
    version: 1
    sorts: [element]
    constants: []
    functions: []
    predicates:
      - {id: ready, args: [element]}
    assertions: []
    bindings: []
  controlled-authoring:
    mode: inspect
    language: en
```

```markdown
::: {.controlled-assertion #condition public="true" review="author-reviewed" reviewed-by="Your name" revision="v1" label="A fictional condition" context="urn:context:example" concept-id="urn:concept:condition" assertion-id="urn:assertion:condition" assertion-revision="v1" domain="fictional-domain" status="conjecture" modality="asserted"}
Claim: for every x of element: ready(x).
:::
```

Place zero or more `Assume:` paragraphs before exactly one `Claim:` paragraph.
Use literal plain text. Unsupported rich content or grammar retains the native
fallback in inspect mode and produces no accepted assertion. Review the source,
declarations, domain, assumptions, status and ordered IR before copying the
generated `controlled-authoring` YAML into the existing configuration. Retain
the other settings. The copied map selects `mode: reviewed` and names the
reviewer/revisions; stale or missing required bindings then refuse admission.

The finite grammar supports declared predicate/function calls, `equal(a, b)`,
`and`, `or`, `not (...)`, `possible (...)`, `necessary (...)`,
`if (...) then (...)`, `for every x of element: ...` and
`there exists x of element: ...`. Quantifiers bind the full following formula;
`and` binds more tightly than `or`. Ordered arguments, binder order, scope,
negation, modality, domain, status and assumptions are retained. Existing
arity/sort/capture/free-variable validation remains authoritative. ASCII aliases
under `controlled-authoring.aliases` can name existing language-independent
declaration IDs; unknown or ambiguous senses refuse. Bounds include 32 new
assertions, 12,000 characters per formula and 65,536 total formula characters.

Optional `controlled-authoring.lexicons` contains finite reviewed English (`en`)
or French (`fr`) declarations. Each lexicon has `version: 1`, `id`, `revision`,
`language`, `review: author-reviewed`, `reviewedBy`, and `sorts`, `constants`,
`functions`, `predicates` arrays. English sorts declare `singular` and
`article: a|an`; French sorts declare `singular` and
`gender: masculine|feminine`. Constant entries have `id`/`label`; function and
predicate entries have `id`/`template`, with every positional slot (`{0}`, `{1}`,
...) exactly once for the declared arity. Every reachable symbol needs an entry.
For the one-predicate example, a French lexicon is:

```yaml
lexicons:
  - version: 1
    id: fr
    revision: v1
    language: fr
    review: author-reviewed
    reviewedBy: Your language reviewer
    sorts:
      - {id: element, singular: élément, gender: masculine}
    constants: []
    functions: []
    predicates:
      - {id: ready, template: "{0} est prêt"}
```

Put `lexicons` inside `controlled-authoring`, then add a separate native panel:

```markdown
::: {.reviewed-realisation #condition-fr public="true" source="condition" lexicon="fr" revision="v1"}
Your authored French fallback remains here until the required review is current.
:::
```

Render in inspect mode again to obtain the realisation's current YAML binding;
review the lexicon and resulting wording before recording that binding. Optional
unsupported/stale realisations retain their native authored fallback with an
explanation. Add `required="true"` only when a missing/currently invalid
realisation should stop rendering. Keep panels outside their source object.
Fixed grammar/agreement does not prove translation fidelity or mathematical
truth. It preserves the declared structure, and a `proved` status remains an
author declaration. Ordinary `lang`, reviewed language-page links/canonicals and
native fallback continue to work independently; this is not an unrestricted
translation engine.


### Shared catalogue and cross-page routes

An optional `catalogue: learning.yml` reads an explicit version-1 YAML catalogue
beside the current QMD, confined to the project. A nested page may use
`../learning.yml`. The catalogue can hold `project`, `defaults`, assertions,
practice, reports and publication settings. Document/project options override it;
`project` and `defaults` maps merge, while other supplied fields replace the
catalogue field. Use complete effective maps when overriding profile metadata.

For cross-page routes, list actual selected outputs and explicit page/object
references; keep this separate from the legacy `.generative-route` map:

```yaml
generative-websites:
  project:
    id: my-course
    revision: v1
    page-id: application
  publication:
    pages:
      - {id: foundations, url: foundations.html, revision: v1, language: en}
      - {id: application, url: application.html, revision: v1, language: en}
  prerequisites:
    goal:
      all:
        - foundations#sets
```

Add a `.learning-journey` panel on participating pages. Render the selected site,
then preview over HTTP(S). Readers explicitly load those public catalogues and
choose a goal; actual native links navigate between pages. `all` needs every
member; `any` selects the first feasible authored alternative. Missing pages,
objects, contexts or hard prerequisites prevent a route rather than disappearing
from it. Partial coverage remains labelled. No arbitrary page is scraped.

After building a journey, this tab's session storage keeps its bounded bookmark.
Resume/import rechecks current page observations, revisions and prerequisites.
Detours preserve a return stack and attempt native focus/scroll restoration.
Route position is not knowledge or mastery. Download/clear controls are available;
bookmarks can reveal chosen goals. New journey JSON and old version-1 page-local
route files are distinct; no silent migration or merged learner profile occurs.

The finite profile admits up to 32 selected pages, 500 objects per public page,
2 MiB per HTML response and 64 MiB of delivered static file bodies. Other source,
expression/depth/visit limits also apply. Unsupported fragments remain unavailable.

### Algorithmic practice

```yaml
generative-websites:
  exercises:
    - id: fraction-practice
      revision: v1
      kind: rational-add
      label: Add two fractions
      public: true
      review: author-reviewed
      min: -5
      max: 5
      maxDenominator: 6
      seed: 42
      source: sets
```

`source` names an appropriately reviewed object on this page. Kinds are
`rational-add`, `rational-subtract`, `rational-multiply`, `finite-union` and
`finite-intersection`. Bounds are integers -20 to 20, denominators 1–12, set size
at most 8 and seeds 0–4294967295. Set kinds use `setSize` instead of
`maxDenominator`. The native prompt remains readable. Browser controls check a
typed answer, clear it and reproduce a seed. Invalid, incorrect and unavailable
checks stay distinct. No general theorem, learning outcome or mastery is graded.

### Ordinary-prose translation candidates

Use ordinary fenced Divs for **author-selected public text only**, keeping an
original and candidate together while you review them. Private data must not
be placed in repository files or QMD. Sensitive sources, provider configuration,
prompts, responses and review receipts belong in a separate private workspace.
This public-text workflow needs no AI or author-written JavaScript:

```markdown
::: {#original .translation-source public="true" revision="v1" lang="en" semantic-id="urn:example:reading-instruction"}
Read the definition before trying the example.
:::

::: {#french .translation-candidate public="true" source="original" revision="v1" lang="fr" semantic-id="urn:example:reading-instruction"}
Lisez la définition avant d'essayer l'exemple.
:::
```

Render or Preview normally. The original and candidate stay readable, followed
by a comparison, exact source/candidate fingerprints, a source JSON packet and
copyable YAML review pins. The default is `translations.mode: inspect`; copying
the pins does not approve the wording. After a competent language review,
change the suggested `review` to `author-reviewed`, supply a deliberately public
or consented reviewer name **or an opaque public review identifier**, and the
real review date, then copy the map into your existing configuration. Keep any
private identity mapping and detailed review receipt outside Git and QMD. In
`mode: reviewed`, changed source, target, language, revision or compiler pins
refuse the old review. Inspection can label unsupported content while retaining
the authored wording. `translations: false` leaves these Divs as ordinary text.

The finite projection supports paragraphs, plain text, ordinary emphasis,
lists, inline spans and links. It retains Math, citations, code, quoted evidence,
link destinations/titles and `translate="no"` content exactly. Structure and
literal numbers must match. Use the same `semantic-id` for the paired objects,
but different native IDs. Nested native IDs, tables, raw HTML, executable or
private/hidden material are unsupported in the candidate projection. Retain
those as separately authored content rather than weakening the comparison.
For a locked passage in a different language, mark its own language too:
`[Keep this evidence.]{translate="no" lang="en"}` inside a French candidate.
Both attributes and the locked wording remain protected. Local reconstruction
keeps the source's spaces and line breaks beside protected mathematics,
citations and code even when the proposed prose omits those separators.

These checks cannot decide whether ordinary prose has preserved meaning,
negation, assumptions, uncertainty or appropriate terminology. A well-formed
candidate remains unreviewed. Review is a declaration, distinct from formal
proof, factual truth, translation-quality assessment and publication approval.

#### Import a candidate JSON

The comparison includes a complete source-bound candidate JSON. Only after
checking that its content is permitted for public output, copy the selected
candidate into the project and declare its path relative to the QMD directory:

```yaml
generative-websites:
  translations:
    mode: inspect
    imports:
      - translations/french.json
```

Keep the matching `.translation-source` in the QMD; remove the duplicated authored
candidate Div when importing that same candidate. The imported native paragraphs
and comparison are appended automatically. Unknown IDs, changed native source
projections (including wording, mathematics and citations),
forged packets, duplicate fields and altered protected objects refuse import.
The binding is to the native Pandoc projection; QMD comments or formatting
whitespace discarded by Pandoc are not separately bound. Source and candidate
packets retain their complete native projections. For protected comparison only,
Pandoc's per-occurrence `citationNoteNum` is canonicalized: identical citations
in two authored paragraphs receive different counters. Citation IDs, hashes,
modes, prefixes, suffixes and citation content remain exact.
Imported candidate paths must stay within the project and cannot use symbolic
links. Keep source
and candidate blocks outside private, hidden or conditional containers
(`content-visible`, `when-*`, `unless-*`); this bounded profile refuses those
containers rather than inferring which output may expose them.

#### Explicit local generation

Generation is optional and never runs during Render/Preview. Install the reviewed
Knowledge Graph Extraction 0.0.16 companion that includes `local-generation.ts`, then
start your chosen local OpenAI-compatible server separately. Copy the rendered
source JSON packet into `source-packet.json` in a separate private directory
outside the project and every Git working tree. Keep the following local
configuration in that directory too:

```yaml
version: 1
provider: local-openai
base-url: http://127.0.0.1:8941/v1
model: gemma-4-E2B
timeout-seconds: 120
max-tokens: 2048
```

From the project root, run the installed command once:

```console
quarto run _extensions/kai-prince-sfhea/generative-websites/translation-prepare.ts --root . --workspace D:/private-translation-work --source source-packet.json --config translation-local.yml --output french.json --language fr --id french --revision v1
```

For a flat local installation, omit `kai-prince-sfhea/`. Create the output
directory first and pass its absolute path. The command refuses to overwrite a file or write its private
work inside the project or a Git working tree. It discovers one
installed KG companion, admits the reviewed transport SHA256
`254cdc60d00cb9104442caaf486a2d6d4dd6210d14c872532f5f92bb3fd910d0`
before import and uses its loopback-only
JSON transport. It downloads no models, installs no SDK and uploads nothing to
an external inference service. Model files and their server must already be
available. Optional API credentials use the transport's named environment
variable; do not put a token in QMD, candidate JSON or a published configuration.

The command sends only the selected source packet: editable prose, read-only
paragraph/list structure, and protected mathematics, code, citations and locked
wording. It reads no surrounding page or additional source file. Prose uses
`sNNN` IDs; immutable `pNNN` landmarks provide context and cannot be returned
as translation segments. Link/image destinations, titles and native attributes
stay outside the model context and remain unchanged in the candidate.

Input is limited to 512 context entries, 8,000 immutable-text characters,
24,576 context bytes and 65,536 bytes for the complete prompt. Larger inputs
refuse rather than being silently shortened. A model's context window may be
smaller: select a shorter source passage or configure a suitable server. These
byte/structure limits do not establish faithful translation. Review referents,
negation, uncertainty, terminology and qualifications beside the original.

After changing the QMD source, Render and copy a fresh source packet. Import
checks the candidate against the current native source and compiler pins; changed
compiler bytes require fresh exact review snapshots. No author-written JavaScript
or manual cache synchronization is needed. Keep copied packets, local model
configuration, requests and detailed review receipts in the external private
workspace; deliberately import only wording permitted for public output.

Some local servers expand JSON-schema string lengths into an unsupported number
of grammar repetitions. The request therefore omits the long-string
`maxLength` constraint, while the extension still rejects every returned prose
segment above 4,000 characters. Exact segment identities/count, the server token
limit and transport byte limits remain bounded. A server initialization or
request failure is reported separately from candidate validity and translation
quality; changing this server-facing schema never approves model wording.

The model may propose only known prose segments. Native math/citations/code
never become model-authored markup. The resulting JSON is an **unreviewed**
candidate and can be refused if it is incomplete or changes numbers/invariants.
The command reports actual response/request/transport identities and the server's
model label; that label does not independently attest the model weights or its
translation quality. Local AI Websites' short cited-proposal broker is a
different interface and is not used as a document translation engine.

For a search-indexable approved language version, place reviewed wording in a
separate normal QMD page, set its `lang`, and use the existing
`publication.language-sets` interface below. Browser candidates do not become
published translations or crawlable parameter combinations automatically.


### Typed assertions and language pages

Optional `assertions` metadata declares version 1, `sorts`, `constants`,
`functions`, `predicates`, `assertions` and `bindings`. Finite typed terms and
predicate/equality/Boolean/quantified/modal formulas retain domain, assumptions,
status, negation and ordered argument/binder roles. Free variables, capture,
wrong arity/sorts and unsupported/deep expressions are refused. An object with
`assertion-id` needs a current binding to its native content/revision and scoped
context. Inspect the exact source/review record before relying on it.

Canonical comparison is conservative structural IR identity, not proof, a solver
or verification of free prose. `proved` is an author-declared status. Native
source hashes retain their real `sha1:`/`sha256:` algorithm prefix; canonical IR
has a separate SHA256 identity. The installed schema describes the closed data
shapes. Do not fabricate hashes to satisfy review fields.

Each language stays a useful authored QMD page with its own `lang`. Optional
`publication.language-sets` declares original page/revision/content digest and
at least two reviewed realisations with real URLs, languages, revisions, content
digests, context, `basedOn` source and reviewers. Optional typed assertion
ID/revision/IRdigest must match across the set and the current native typed record.
Source edits invalidate dependent review declarations.

The output contains ordinary visible language links and reciprocal/self
alternates. With Quarto `website.site-url`, each language has its own absolute
canonical. Without it links remain relative; crawler/SEO acceptance is not
established. There is no guessed redirect or canonicalisation of all languages
to English. IDs or matching metadata do not prove a translation; bilingual human
review remains necessary. Ordinary-prose candidates now have the explicit source-bound workflow above; arbitrary faithful automatic translation is not established.

### Daily/weekly transparency

```yaml
generative-websites:
  records:
    - id: example-activity
      revision: v1
      kind: activity
      public: true
      review: author-reviewed
      label: Reviewed a learning activity
      occurredOn: "2026-10-25"
      recordedOn: "2026-10-25"
      source: sets
  reports:
    - id: daily-summary
      period: day
      start: "2026-10-25"
```

Kinds distinguish activities, outputs, outcomes, impacts, evidence and reflections;
outcomes/impacts require an authored `qualification`. Periods are `day` or
Monday-based `iso-week`, with occurrence and recording dates separate. A report's
`targets` can supply reviewed public project/role context with identity, revision,
label and source, without inventing an activity date. Private/candidate records
and unknown targets are omitted without publishing their labels.

First render a draft and inspect its fingerprint. Add
`review: {reviewer, date, sourceDigest}` to that report using the exact fingerprint
only after review. Changed eligible records, supporting context or period make
it stale. Corrections use `supersedes`; evidence/context/correction associations
are not causal verification or an automatic CV import.

Interactive CV 0.0.9 (report protocol introduced in 0.0.6) can explicitly request native daily/weekly reports from its
existing public catalogue with `interactive-cv.reports`. That companion discovers
this separately installed provider; no duplicate GW activity records are needed.
Its exact public CV record hashes are labelled `published-cv-record`, separately
from the native-content hashes used above. It keeps undated assertions, contrary
evidence and public reflections in a distinct supporting-context section and
binds declared review to the complete CV/report scope. Installing this extension
alone does not enable that optional CV feature.

### Reviewed controlled statements to a Sandbox problem

The optional `scenario-candidates` feature derives a small problem from the
existing controlled assertion IR. It does not interpret unrestricted prose or
generate a solution. Keep the statements in ordinary QMD and assign `given`,
`rule` or `goal` to a Span around the **entire Claim paragraph**. The original
text remains readable. For example, with `Parcel`, `parcel`, `checked` and
`released` declared in the existing assertion registry:

```markdown
::: {#checked .controlled-assertion label="Checked parcel" concept-id="urn:parcel:checked" assertion-id="urn:assertion:checked" context="parcel-workshop" domain="parcels" revision="1" public="true" review="author-reviewed" reviewed-by="Course author"}
[Claim: checked(parcel).]{#checked-role .scenario-statement scenario="release-check" scenario-role="given"}
:::

::: {#release-rule .controlled-assertion label="Release rule" concept-id="urn:parcel:rule" assertion-id="urn:assertion:rule" context="parcel-workshop" domain="parcels" revision="1" public="true" review="author-reviewed" reviewed-by="Course author"}
Assume: checked(parcel).

[Claim: released(parcel).]{#release-role .scenario-statement scenario="release-check" scenario-role="rule"}
:::

::: {#release-goal .controlled-assertion label="Release goal" concept-id="urn:parcel:goal" assertion-id="urn:assertion:goal" context="parcel-workshop" domain="parcels" revision="1" public="true" review="author-reviewed" reviewed-by="Course author"}
[Claim: released(parcel).]{#goal-role .scenario-statement scenario="release-check" scenario-role="goal"}
:::

::: {.learning-sandbox}
Inspect a reviewed problem and import it manually in the Sandbox.
:::
```

Add to your existing metadata map, retaining its other options:

```yaml
generative-websites:
  controlled-authoring: {mode: inspect}
  assertions:
    version: 1
    sorts: [Parcel]
    constants: [{id: parcel, sort: Parcel}]
    functions: []
    predicates:
      - {id: checked, args: [Parcel]}
      - {id: released, args: [Parcel]}
    assertions: []
    bindings: []
  scenario-candidates:
    mode: inspect
    scenarios:
      - id: release-check
        revision: '1'
        label: Release check
        description: Apply the stated rule to an assumed checked parcel.
    reviews: []
```

Render once. Inspect the native candidate's source links, roles and atom/rule/goal
mapping, then copy its generated `scenario-candidates` YAML into the same map.
It contains current review pins and selects `mode: reviewed`. Review pins bind
the exact native object and role content, revisions, typed IR, page/project,
compiler artifacts and resulting problem bytes. A changed or missing pin withholds
the whole problem; inspect again and review deliberately. No author-written
JavaScript or second logical fact store is required.

This profile accepts ground positive predicates with typed constants. A rule
uses positive atomic/conjunctive assumptions and an atomic conclusion, or a
single implication with that shape. Rule assumptions never become initial facts;
goals never become givens. Variables/functions, quantifiers, equality, negation,
disjunction, modal assertions and mixed context/domain problems are unsupported.
The original richer controlled source remains available. Answer, hint, solution,
feedback, private/hidden/conditional and ambiguous role sources cannot supply
facts, rules or goals. Unsupported input withholds the entire scenario rather
than exporting an easier subset. Each scenario has at most 40 atoms/80 rules and
the existing bounded THY export; total selected controlled statements remain 32.

`given` means assumed for this problem. Neither an authored `proved` status nor a
review marker is a new proof result. Native content hashes do not claim original
QMD/include byte offsets, authenticated review or source fidelity. This feature
does not add accepted global assertion bindings in controlled inspect mode.
Existing manually authored `sandbox` problems, session files and route-return
controls continue to work; problem-ID collisions refuse. The external Sandbox
still owns import, regeneration and actual checking.

### WAI-Adapt project symbol pilot

Optional `wai-adapt` annotates reviewed plain-text Spans using the actual
[`adapt-symbol` attribute](https://www.w3.org/TR/adapt-symbols/). The referenced
[AAC registry](https://www.w3.org/TR/aac-registry/) is a draft; this finite pilot
supports 14704 (help noun), 14705 (help verb) and 14885 (home). It does not support
compound values, promise browser/AAC-helper support or establish AAC familiarity
or general WAI-Adapt conformance. Your label-to-concept decision needs review.

```markdown
[Help]{#course-help .learning-symbol aac="14704" revision="1" public="true" review="author-reviewed" reviewed-by="Course author"}
```

Start with annotation-only inspection:

```yaml
generative-websites:
  wai-adapt:
    mode: inspect
    helper: false
    symbols: []
    reviews: []
```

Render, compare the label and registry meaning, then copy the current generated
YAML review. Reviewed mode adds the standard attribute while retaining the text.
Missing/false configuration adds no symbol packet or controls. Stale bindings
retain the ordinary text and withhold the annotation. Unsupported/private or
ambiguous authoring refuses with a native diagnostic.

For the named original **`gw-local-symbols-v1`** helper, supply an original or
properly licensed local PNG and its declared rights. You do not calculate hashes:
native inspection reads the exact asset and puts its observed SHA256 into the
copyable review binding. For example:

```yaml
generative-websites:
  wai-adapt:
    mode: inspect
    helper: gw-local-symbols-v1
    symbols:
      - concept: '14704'
        path: symbols/help.png
        licence: CC0-1.0
        attribution: Original project help picture by the course author
    reviews: []
```

Paths are relative to the containing QMD, physically confined to the project;
in-project `../` is allowed. Symlinks, remote URLs, unknown fields, corrupt PNGs
and exceeded bounds refuse. There are at most 32 annotations/assets, 256 KiB per
image/2 MiB total and 2048×2048 dimension bounds. No symbol art is downloaded or
bundled automatically. A rights declaration does not establish legal permission.

After review, **Show symbols** explicitly fetches, checks and adds the selected
project images alongside their original text; **Reset symbols** removes only the
helper's additions. Text and link/button accessible names stay intact. No model,
personal diagnosis, preferred-symbol inference, saved preference or remote pack
is involved. Source/DOM/asset changes cancel or refuse the enhancement. Without
JavaScript or a compatible helper the text remains readable. A generic original
picture is a project symbol-set example, not evidence of familiar AAC vocabulary.
Other symbol sets/helpers and human AAC/assistive-technology evaluation require
separate real checks. Draft Help-module `data-*` examples are not emitted as
standardized attributes.

### Sandbox, offline reading and editable source

A `.learning-sandbox` panel and explicit `sandbox: [{source, spec}]` allow a
problem-only `.thy` download. The version-1 spec contains ID/revision/label/
description, explicit public/review flags, Boolean atoms, givens, Horn rules and
goals. The schema gives the complete shape. Import manually in the Sandbox and
recheck there. Goals never become givens. No Sandbox implementation is copied.

#### Keep a reasoning session and return to your reading

The same `.learning-sandbox` panel now adds file controls; no additional author
script is needed. Download the problem's `.thy` file and import it using the
Sandbox's ordinary controls. Export a Thread session there, then choose that
JSON file under **Choose a session JSON file** on this page. Inspection runs in
browser memory: nothing is uploaded, no model or checker runs, and no reading
route changes automatically. Files can contain private drafts, dialogue and
reflections; only explicitly download or publish what you intend to share.

The panel distinguishes reported confirmed membership from pending
interpretations. Every imported proof, epistemic and completion status stays
**reported; not rechecked**. A structurally compatible envelope is not a
successful restoration or a proof. Supported inspection is bounded to
20,000,000 UTF-8 bytes, three ordered stages, 128 confirmed claims per stage and
32 distinct dependencies on earlier claims within that stage. Exports without
a current server envelope remain inspectable archives with an explicit reason.

**Download exact Thread session bytes** preserves the selected file's original
bytes and SHA256, including whitespace and any UTF-8 BOM. A **source-bound
session capsule** additionally ties those bytes to this current native
page/project/problem and revision. Creating or accepting a capsule requires the
actual current problem export, a matching scenario source after only leading
BOM/CRLF normalization, and matching declared positive Boolean/Horn fields.
Changed source, labels, facts, rules, goals or revisions are refused. Hashes
detect changed inputs; they do not authenticate the learner or author. Earlier
stages remain preserved but are not claimed to originate in this page.

You may explicitly attach the tab's validated reading route and return frame
when creating a capsule. Importing it still changes no navigation state. Use
**Restore attached reading route** or **Return to attached reading position**
to re-fetch the selected public catalogues, check their current source and
prerequisite identities, and restore the route or nested return position.
Unknown, changed, incomplete or unsafe destinations are refused. Reading
position and a reported completed attempt never imply mastery. Cancel/Clear
discard these controls' pending work or in-memory inspection; separately
downloaded files and reading routes have their own controls.

To resume the reasoning attempt in a compatible Argumentation Sandbox, use its
device page's **Restore** control with the exact Thread JSON. That is distinct
from its ordinary scenario importer. The Sandbox owns scenario regeneration,
fresh claim checks, rollback and any required local-tool setup. This extension
neither invokes that API nor promotes a reported status to a checked result.

#### Declare course roles for argument interchange

Optional `sandbox-session-mappings` links original authored atom IDs to course
claims, evidence and objections. Merge `sandbox` and `sandbox-session-mappings`
into the tutorial's existing `generative-websites` YAML mapping, keeping its
project/defaults; do not add a second top-level mapping with the same name.
In this fictional P/Q declaration, `source: sets` selects that tutorial's
existing reviewed native object. Replace the logical exercise and review
declaration with your own reviewed material.

```yaml
generative-websites:
  sandbox:
    - source: sets
      spec:
        version: 1
        id: conditional-argument
        revision: v1
        label: A fictional conditional argument
        description: Derive Q using the stated P and implication.
        public: true
        review: author-reviewed
        atoms:
          - {id: premise, label: P holds}
          - {id: conclusion, label: Q holds}
        givens: [premise]
        rules:
          - {id: implication, premises: [premise], conclusion: conclusion}
        goals: [conclusion]
  sandbox-session-mappings:
    - problem: conditional-argument
      atoms:
        - {id: premise, role: evidence, targets: [conclusion]}
        - {id: conclusion, role: claim}
```

Add a panel in the QMD body:

```markdown
::: {.learning-sandbox}
Download the declared problem or inspect a reasoning file when you choose.
:::
```

Mappings allow up to 16 existing exported problems and 40 distinct atoms per
problem. Roles are exactly `claim`, `evidence` or `objection`. Evidence and
objections may list distinct, existing, non-self `targets`; a claim has no
`targets` field. An objection is an explicit pedagogical declaration, not an
inferred contradiction, and an evidence target does not verify support.

**Download AIF projection** and **Download xAIF projection** offer finite
information/inference/conflict views. When current source association succeeds,
namespaced course metadata preserves original atom IDs, their generated Sandbox
IDs, native source/problem identities and the explicit roles/targets. Logical
CA nodes describe represented polarity conflicts; a pedagogical objection never
creates a CA automatically. An unrelated archive can instead produce an
explicitly unbound view with no course-role mapping.

Each downloaded projection includes namespaced per-feature losses. Unsupported
logic remains reported text; pending interpretations never become givens or
confirmed steps. Standard AIF/xAIF cannot restore the original finite session,
checker evidence, dialogue, reflections or reading route. Keep the exact Thread
JSON or capsule for that archive. This is original interchange code using
documented data, not an embedded Sandbox or a claim of universal AIF-client
compatibility.

`offline: {enabled: true}` adds optional storage controls to a journey. A complete
route plus explicit unchecked-by-default reader consent is required. `maxBytes`
lowers the static file-body budget within 1024–67108864 bytes; browser/metadata
overhead is additional. `expiresDays` is 1–30, default 7; an earlier
`publication.expiresAt` also limits expiry. Use HTTPS or localhost. A dedicated
project-root worker refuses unrelated existing scopes/workers and serves only a
committed observed public snapshot.

Required pages, prerequisites, assets and hashes must be available. Unsupported
dynamic dependencies, remote critical assets, cancellation or quota failure
prevent readiness. This is not whole-site offline support. Models, private
sources and Sandbox state are not implicitly cached. Inspect/delete controls
manage this project's named caches. Offline readers cannot discover new
withdrawals/revisions until contact resumes; downloaded copies cannot be recalled.
CSP/deployment and final-output auditing remain separate, including later hooks.

Editable source needs separate explicit author consent:

```yaml
generative-websites:
  oer:
    source-consent: true
    files:
      - path: example.qmd
        licence: Apache-2.0
        attribution: Your name; identify other contributors
        modifications: Describe changes to this selected source
        ai: Describe material AI assistance, or state none
```

Add `.learning-export` or use a journey's export control. Select every required
public QMD/include/catalogue/asset with component rights. A bounded approved
runtime inventory is included by default. No project directory is automatically
packaged. Missing required dependencies or rights prevent a complete download.
The ZIP records exact hashes, attributions, modifications, AI disclosures and
reconstruction instructions.

**Source consent publishes raw selected bytes**, including comments/frontmatter.
Rendered privacy is not source redaction. Private declarations are conservatively
refused; use cleaned public sources and inspect the selection. A manifest is not
legal clearance or proof of independent reconstruction. Route JSON is a bookmark,
not an editable OER. FAIR, open permissions and accessibility are separate.

## Optional local Numbas 11 activity

The optional adapter uses a separately prepared Numbas 11.0 standalone folder.
It bundles no engine, font, software installer or question collection. The
initial supported profile is finite number-entry questions: declared numeric
variables, arithmetic and bounded literal `random(low..high)` ranges. Text/name
substitutions may use that finite arithmetic; arbitrary JME functions, HTML
resources, custom marking, scripts, extensions, question resources and unsupported
question/part types refuse. This is not a general Numbas importer.

Keep a readable task in ordinary QMD:

```markdown
::: {.learning-numbas #addition}
Add the displayed whole numbers. Explain your method to a partner.
:::
```

Use an existing website/book project with a separate output directory, or start
with this ordinary `_quarto.yml`:

```yaml
project:
  type: website
  output-dir: _site
filters:
  - kai-prince-sfhea/generative-websites
```

Use `generative-websites` instead for a local-source installation. This publisher
needs **Render Project** and a distinct output directory; ordinary standalone GW
pages with no Numbas setting keep their existing HTML/Word workflow.

First obtain/export a genuine Numbas 11.0 standalone folder. Obtain and extract
the official `mathjax` and `@mathjax/mathjax-newcm-font` 4.1.3 packages separately;
no npm installation, package hook or author-written JavaScript is required. From
your project directory, run the installed preparer with your actual paths:

```powershell
quarto run _extensions/kai-prince-sfhea/generative-websites/numbas/numbas-prepare.ts --root . --source _numbas-export/addition --output _activities/addition --mathjax C:/software/mathjax --font C:/software/mathjax-newcm-font --id addition --label "Addition practice" --seed addition-seed-1 --question-licence CC0-1.0 --question-attribution "Actual question author"
```

Use the unqualified `_extensions/generative-websites/` path for a local-source
installation. The source is an ordinary folder inside your project; output must
be a new project-confined folder. Supply the actual question licence and author,
rather than copying the fictional values blindly. The command performs no
download or software installation and does not certify licences. It records the
exact source/library inventories, preserves your original export, prepares local
MathJax resources and reports missing source notices explicitly. Keep exports and
prepared folders under underscore-prefixed directories as shown, so normal
Quarto discovery does not try to render vendor README files as project pages.
The adapter publishes only its managed package copy. Do not select project
sources inside an engine folder; those inputs refuse rather than bypass source
freshness checks.

Configure the matching native ID, label, path, seed and rights in QMD/YAML:

```yaml
generative-websites:
  numbas:
    - id: addition
      label: Addition practice
      path: _activities/addition
      version: '11.0'
      seed: addition-seed-1
      question-rights:
        licence: CC0-1.0
        attribution: Actual question author
```

Paths are relative to the containing QMD, so a nested page might use
`../_activities/addition`. Render Project to inspect the native task and generated
review map. After reviewing the actual question, runtime and third-party
notices, copy the generated `review` map under this activity, replacing its
reviewer/date placeholders. Re-render. The fingerprint binds all package bytes,
derived entry, question, seed, path, label and declared rights. Changes require
new review. No hand hashing is required.

The reader explicitly chooses **Load activity** or **Unload activity**. Initial
page load creates no activity frame or resource fetch. Load checks current
resource hashes and waits for actual native Numbas readiness and the fixed seed.
If host CSP prevents startup, or readiness times out, the native task stays
readable. Word keeps that native task and inspection. No scoring IPC or mastery
record is invented.

These are trusted same-origin activities, not security-sandboxed third-party
embeds. Numbas can require permissions such as JavaScript evaluation. The
adapter never changes the parent CSP; review host policy separately. Technical
checks do not establish general accessibility, OS offline operation, learning
benefit, source authenticity, rights clearance or institutional approval.

The preparer automatically includes a separately labelled distributor notice
supplement when the selected NewCM 4.1.3 files match the supported unchanged
188-file selection, including 105 WOFF2 files. The supplement contains verbatim
official GUST 1.0 and LPPL 1.3c texts, observed embedded copyright notices, exact
upstream retrieval information and the selection/relocation record. All font
bytes and the upstream package's Apache-2.0 metadata remain unchanged. These
distributor additions stay separate from the licence/notice files absent from
the upstream npm package; its missing-notice status is retained.

Custom or changed font selections retain their source-supplied notices and
explicitly report that the known-font supplement was not applied. They inherit
no known-selection copyright receipt. Missing or changed installed supplement
files require reinstalling the complete extension. Preparation generates the
complete resource inventory and a new copyable review pin; inspect these before
replacing an old pin. No manual resource hashes, font modifications, model,
download or author-written JavaScript are involved. Editable OER reconstructions
include the same finite notice files with their separate original terms.

These technical records do not establish the complete LPPL Work/source-build
history, contributors' authority or redistribution rights, and are not legal
clearance or upstream endorsement. Review those qualifications before publishing
the separately acquired activity and libraries. The lean extension bundles no
Numbas engine, MathJax runtime or bulk fonts.

Use `numbas: false` or remove the optional setting to retire that page's exact
managed references on its next HTML render. Shared generations remain until
their last reference disappears. Render Project after source exclusion,
deletion or permission changes; at least one current GW HTML document must
render to process effective-source retirement. Word-only or empty projects do
not retire HTML. Unrendered old HTML remains ordinary stale Quarto output.

Package copies and exact owned retirement finish during native compilation,
before CSP/KG post-render audits. The final GW hook only verifies actual HTML and
assets and writes private evidence. This is not an atomic website transaction:
a failed render can retain exact byte-owned assets, and its preparation record
does not certify a successful HTML build. Unrelated or edited files are never
swept. Use serial project renders and inspect failed-build diagnostics before
publishing.

Removing a page's GW filter or uninstalling the extension removes its observer;
that action alone cannot retire existing output. Use a clean full publication
after filter or permission changes. Editable OER exports retain the lean GW hook
helpers, but do not bundle or clear rights for Numbas/MathJax/font packages. A
Numbas-enabled source requires the separately supplied local package and current
review before interactive practice can be reconstructed. Keep the native task
as the readable fallback; ordinary OER reconstruction is a separate check from
redistributing or reconstructing the optional engine.


## Use alongside the other extensions

Generative Websites works independently with the explicit prerequisite map below. Install each optional extension normally; Quarto has no general automatic filter dependency resolver. For combined operation, put `generative-websites` before `local-ai-websites` in `filters`; Knowledge Graph Extraction uses its own prepared-render lifecycle. Keep the owner-qualified selectors when installing from GitHub.

For a website using graph prerequisites and optional source search, merge this
configuration into `_quarto.yml` after installing those extensions. Local
installations use the unqualified selectors described above.

```yaml
filters:
  - kai-prince-sfhea/generative-websites
  - kai-prince-sfhea/local-ai-websites
  - kai-prince-sfhea/knowledge-graph-extraction
knowledge-graph:
  navigation: true
```

The current development sources are Generative Websites 0.0.12, Local AI Websites
0.0.12 and Knowledge Graph Extraction 0.0.16; current-byte composed verification
is separate from earlier evidence. Shared mathematical
identities use Maths Knowledge Graph 0.0.9 and Accessible Maths 0.0.9.
Interactive CV is 0.0.10, Content Security Protocol is 0.0.7, and Additional
Citation Options is 1.1.0-dev.5. These version identities are not a general
compatibility promise for older combinations.
With no active compatible graph preparation, the authored manual prerequisite
map remains the standalone route. A missing Local AI extension leaves native
reviewed learning content intact.

**Knowledge Graph Extraction:** a normal project render prepares public, author-declared `requires` relationships before page rendering. Generative Websites reuses those relationships for reviewed learning objects whose `concept-id` resolves to the same canonical URI. Shared catalogue namespace prefixes are resolved from that current prepared render: for example, `math:group-action` can match the expanded HTTPS identity without copying the catalogue's namespace mapping into page metadata. The authored identity is preserved in the learning catalogue. Unknown prefixes and two learning objects resolving to one canonical identity are refused rather than silently dropping preparation links or matching labels. Standalone authoring can use `graph-prerequisites: false`. The website graph is selected by default. An ungrouped `requires` edge means required preparation; edges sharing a nonempty `prerequisite-group` are alternatives. Explicit `prerequisites` for an object override its imported graph relationships. No duplicate prerequisite map is needed. Candidate/private objects and relationships are excluded by the producer.

```yaml
generative-websites:
  graph-prerequisites: website
  local-ai-sources: true
```

Select another graph ID, or use `graph-prerequisites: false` for manual prerequisites only. Routes still contain this page's reviewed learning objects; a required concept with no reviewed learning object on the page produces an unavailable route rather than being silently omitted. The learning page does not need to be added to the graph catalogue's extraction-source list merely to consume prerequisites. This is a current-render declaration adapter, not a previous-output fetch, cross-page learning renderer or inference of pedagogical equivalence from labels. Context compatibility, cycle checks, bounded search and exact snapshot restoration remain enforced. Updating graph prerequisites changes the route snapshot in the same render.

**Local AI Websites:** explicit public `objective`, `givens`, `explanation` and `qualification` roles in additive objects become excerpts; protected answer/hidden ancestors are excluded. Safe legacy whole objects retain their previous source behavior. Use `local-ai-sources: false` for manual selection. Keep hints/solutions/feedback separate from public explanatory givens. Native links, qualifications and source budgets remain authoritative. Visitor downloads, cancellation and unreviewed proposals stay Local AI's responsibility; no model runs during rendering and proposals never replace authored variants. Graph summaries support discovery without becoming reviewed evidence automatically.

Use ordinary `quarto preview` while editing QMD and YAML, or
`quarto render` for a complete static build. No custom `.mjs` preview server is
needed. Optional browser model preparation uses Local AI Websites' installed
action; it does not add an author-written build script to the routine cycle.
With whole-site KG discovery, start with a full Render Project. See KG's README
for the tested Windows Quarto prerelease's direct-HTML preview cache defect and
supported YAML static-preview workaround; `--render all` alone does not avoid it.
Partial edits retain the documented conservative graph replay boundary.
If a catalogue-only change is not noticed by the editor's watcher, run a normal
render before relying on the derived route. Do not reuse an old generated graph
to conceal incomplete or stale output.

**Maths Knowledge Graph and Accessible Maths:** keep their native theorem/notation authoring in the learning objects. A learning-object Div can omit `concept-id` when Maths Knowledge Graph has already supplied its canonical `semantic-id` from the declaration for that native anchor. If both attributes are present they must agree; conflicting identities fail rather than silently choosing one. Put Maths Knowledge Graph before Generative Websites, using its documented pre-AST stage. Canonical identities and graph prerequisites are reused without copying mathematical content. Review, context and two authored learning views are still explicit: no proof validity or learning view is inferred from a theorem catalogue. **Interactive CV** can use a separate graph; enabling that graph does not merge it into this page's website learning prerequisites or create a learner profile. Remove an optional extension and its selector to retain the ordinary authored learning content; restore an explicit `concept-id` if its identity previously came only from that extension.

| Combination | Current behaviour |
|---|---|
| Generative Websites alone | Reviewed native adaptation and explicit cross-page journeys; legacy routes retain two reviewed authored views and manual prerequisites |
| With Knowledge Graph Extraction | Reuse current-render public `requires` edges, including explicit alternative groups |
| With Maths Knowledge Graph | Reuse canonical native `semantic-id`; keep learning review/context explicit |
| With Local AI Websites, in the documented order | Reviewed learning blocks supply search/evidence excerpts without duplicated prose |
| Additive reviewed adaptation / cross-page journeys | Explicit literal variants and selected public page catalogues; legacy local route unchanged |
| Language links / finite practice / Sandbox handoff | Reviewed native page mappings, bounded checkers and manual problem-only export; no translation/proof verification |
| Scenario candidates, without optional extensions | Native controlled ground-Horn role inspection and exact author review; existing Sandbox export/return controls are reused, actual external checking stays separate |
| WAI-Adapt, without any external helper | Reviewed standard annotations retain readable text; the optional named local project symbol helper offers explicit Show/Reset and no universal AAC support claim |
| Interactive CV 0.0.9 (provider introduced in 0.0.6) | Original professional-selection provider plus explicitly requested daily/weekly reports from the CV's existing public records; source hashes retain their exact record scope and no career claim is rewritten |

## Define learning objects

Use a native ID for each occurrence and a scoped URI for the concept it discusses
(or the shared canonical `semantic-id` supplied by Maths Knowledge Graph).
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
`constructor` and `prototype` are reserved and cannot be object/reference IDs.
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
misconception. See the complete bijections activity in [advanced.qmd](advanced.qmd).
These are authoring conventions, not additional required configuration or a
grading engine; update the object revision when shared content changes.

Invite readers to try a question before requesting help, and let them choose
their support. Solutions are delivered with the page: search, native
source, print, Word and ePub can expose them. They do not protect assessment
answers. A visit, level choice or revealed solution does not demonstrate mastery.
The legacy starting-knowledge choices are self-reported preparation, and that
example does not infer ability or mark an answer correct. Its activity collects
no response; the separate finite practice checker is described above.

Keep source, creator, licence and adaptation notes visible with reused material.
The synthetic example is original Apache-2.0 source with material Codex
assistance; its review fields demonstrate syntax rather than independent
validation. Your teaching content and each reused component need their own
rights decision. Downloaded route JSON contains settings, not an editable OER
corpus or a verified record of achievement. The new selected editable-source
export is separate and requires its own consent/rights/reconstruction checks.
Broader interest variants and external activity engines remain future work.

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

Quarto resolves project, directory, document, format, profile and metadata-file
settings before the filter reads its effective metadata. Use Quarto's normal
overrides; the extension does not read a separate configuration file or replace
your project settings. The recorded checks exercise these layers separately,
including document overrides of project settings, on Quarto 1.11.5 pre-release.
Document metadata can override lower-priority metadata-file values. To disable
a page that defines its own `generative-websites` map, put `enabled: false`
in that map; do not assume a separate metadata file overrides it.

The prerequisite example and `bijections` goal below use all four objects in
`advanced.qmd`. For a page containing only the `sets` object above, omit that
prerequisite map and use `goal="sets"`.

Add one panel per page:

```markdown
::: {.generative-route goal="bijections" level="introductory"}
## Choose a learning route
:::
```

The goal defaults to the first selected object; level defaults to introductory.
Only `lang: en` is supported by this legacy two-view path. Without this panel or
additive feature metadata a page receives no extension browser assets. Unknown configuration keys and malformed annotations
produce actionable render errors without echoing supplied option keys or object
IDs. Diagnostic occurrences are processing ordinals, not source line numbers.
Unbound prerequisite warnings show at most five occurrences plus a total.
Ordinary Quarto logs may still include author metadata and remain private. Limits are 50 objects, 512 prerequisite
expression nodes, depth 16, and 20,000 object visits per route search.

The installed [configuration reference schema](_extensions/generative-websites/config-v1.schema.json)
describes the **value of `generative-websites` metadata**, using JSON Schema
Draft 2020-12. A compatible validator can check its structure after YAML-to-JSON
conversion. It is not automatically registered with Quarto or your editor.
Runtime validation also checks total expression count/depth, byte limits, page
binding and available reviewed content; passing the schema does not establish
those checks or the correctness of authored prerequisites.
In a GitHub consumer the schema is installed at
`_extensions/kai-prince-sfhea/generative-websites/config-v1.schema.json`; the
relative link above points to its location in this source repository.

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

Quarto `--quiet` can suppress diagnostic text while retaining a nonzero failure status. Re-run with `--log-level error` to see the extension's safe contract message; ordinary render logs remain author material.

## Disable, update or remove

```yaml
generative-websites:
  enabled: false
```

Deactivation bypasses stale extension settings and preserves native content.
For a GitHub consumer:

```powershell
quarto update extension kai-prince-sfhea/generative-websites --no-prompt
quarto remove kai-prince-sfhea/generative-websites --no-prompt
```

Remove the filter from your YAML before rendering after removal. Your prose,
links and fenced Divs remain native Quarto source. Use the new journey's tab-route
and optional offline-delete controls to clear its own reader data first;
removing an extension cannot recall downloaded files or browser-saved copies.
For a local installation, use `quarto update extension ../generative-websites --no-prompt`
and `quarto remove generative-websites --no-prompt`, then remove the local filter
selector. Review the changelog and re-render after an update; a changed snapshot
requires a newly built route rather than relabelling an old route file.

## Current boundaries and rights

| Recorded legacy scope on this host | Boundary |
|---|---|
| Windows; Quarto 1.11.5 pre-release | Other versions/platforms remain unverified. |
| Document and website HTML; nested pages; native preview/watch | Normal metadata layers, existing hooks, theme and includes are preserved in the recorded fixtures. |
| HTML with `embed-resources: true` | Browser entry executes after Quarto transforms/embeds it; whole-site offline/CSP acceptance is separate. |
| Word and ePub | Legacy static route and both labelled views; additive adaptation instead keeps its selected author defaults. No interactive controls. |
| Unicode prose/labels; spaces and Latin-1 input filenames | ASCII object IDs are required. A CJK consumer-directory path hit an independently reproduced native filter-loader encoding failure on this host. |
| Legacy page-local route | Page memory plus explicit files; new project journeys separately use tab-session bookmarks and optional consented offline storage. Route v0 exports from 0.0.1 are unsupported. |

Version 0.0.5 introduced optional current-render prerequisite and shared-identity/source
adapters. Existing manual prerequisite maps remain supported and take precedence.
Adding or changing graph-derived prerequisites changes the exact route snapshot;
download a fresh route after re-rendering. Version-1 route data is unchanged.
The configuration and route-file APIs remain experimental. Version-1 restoration
requires the exact snapshot; re-rendered changes may require a newly built route.
This is intentional stale-content refusal, not a route migration service.
Experimental 0.x versions may change authoring or route-file contracts. Any
incompatible change must be documented in the changelog with replacement syntax
or an explicit refusal/migration policy. Preserve your native source; after an
incompatible change, review the new instructions and build/download a new route.
There is no automatic migration or compatibility promise for an old route file.

The legacy route renderer remains page-local and deterministic. The additive
0.0.7 and 0.0.8 contracts above cover reviewed native variants, explicit public cross-page
delivery, finite practice, declared language publication, problem-only Sandbox
handoff, exact session archives/source-bound capsules, explicit argument-view
mappings, period reports and selected offline/editable-source tooling. These are
bounded mechanisms, not the entire research roadmap. The optional author command
can draft an unreviewed prose translation; automatic semantic approval,
unrestricted NLP/semantic verification, general proof assessment and AI replacement
of reviewed pages remain outside this implementation. Model quality, independent
OER reconstruction, human access and deployed offline/security acceptance remain
separate checks for the final exact bytes.
Static source pages are available to crawlers; no ranking or learner-outcome
claim follows.

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

## AI assistance and verification

Kai Prince directed the project and selected its aims. **OpenAI Codex materially
assisted** the research interpretation,
architecture, source, tests, expected-result design and documentation. Tests
written with the implementation are not independent semantic or accessibility
evaluation. No AI inference runs while rendering or using GW-0, and AI assistance
does not imply University of Manchester approval or replace applicable human
review and Responsible AI guidance.

The example is deliberately synthetic and AI-assisted. Its review fields
demonstrate authoring syntax; they are not records of independent human approval.
Authors remain responsible for checking content, rights, publication scope and
the institutional rules applicable to their use. Automated checks do not establish
originality of every contribution, mathematical correctness or learning benefit.

The local 0.0.12 continuation passes 325 portable checks, six tutorial and thirteen
translation native commands. Focused Numbas/OER checks pass after a private
test-output parser correction; prepared activity publication passes after a
private review-output parser correction. Those original harness failures remain
recorded. All six one-shot genuine installed translation commands pass response,
protected-object, provenance and original request/response retention checks. A
separate finite AI-assisted meaning assessment finds five passes and one wrong
mathematical term sense. These candidates remain private and unreviewed: preserved
maths, identifiers and citations do not establish correct translation meaning.
This is not bilingual human acceptance or evidence of general translation quality.

The following paragraph describes recorded 0.0.8 bytes. Current 0.0.12 native
and bounded model observations are reported above. They do not establish general
Numbas accessibility, learning benefit, rights clearance, security or offline acceptance.

The local 0.0.8 stage passes the serial full regression, including native
controlled review/Word, the current tutorial, semantic publication/OER, graph
composition, compatibility, Preview and visibility checks. A subsequent CSS-only
contrast correction has fresh 14-command activity and seven-command axis native
checks, eight actual activity-browser groups and four axis-browser groups.
The original full run retains its pre-CSS scope; all compiler/JavaScript bytes
are unchanged. Enabled activity buttons pass the measured normal/hover/focus
text-contrast checks in the tested Litera fixture. This does not establish
all-theme, human accessibility, language fidelity, learning or release acceptance.

The recorded 0.0.3 checks passed 65 Node tests, 85 structural-schema cases,
23 installed-lifecycle groups, 16 compatibility groups plus a separately
classified native CJK-loader observation, eight native activity groups, and
29 actual-browser groups across the route, activity and visibility fixtures.
Seven preview/watch groups and six native-output parity groups also passed.
These checks used Windows, Quarto 1.11.5 pre-release and Edge 155.0.4283.45 where
applicable. Native Quarto suites ran serially; concurrent project renders and
other platforms/versions remain unverified. Independent content review, manual
keyboard/screen-reader acceptance and educational evaluation remain open.

Developer tests, fixtures, benchmarks, plans and raw receipts are intentionally
outside this lean source distribution and are not publicly available from this
folder. This checkout alone cannot reproduce the full internal suite or its
performance measurements. You can reproduce the documented installation and supplied
`example.qmd` or `advanced.qmd` workflow using the distributed files and Quarto. External
reproduction of the full suite requires a separately shared, versioned developer
workspace and its recorded tools/evidence; no bundled test runner is advertised.

## Reporting problems

Use [GitHub Issues](https://github.com/kai-prince-sfhea/generative-websites/issues) for reproducible,
non-sensitive bugs, preferably with a small synthetic example, Quarto/browser
versions and expected/observed behaviour. Do not post credentials, confidential
content, learner records or unmitigated vulnerability details in public issues.
No dedicated confidential security-reporting channel is currently advertised;
request a private reporting route without disclosing the vulnerability itself.

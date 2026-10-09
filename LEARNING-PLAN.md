# Learning Plan: Understanding the WebP Image-Service Change

A guided path to fully own the image-service code we added to `packages/website`
(the custom image service + the Astro integration that wires it up), plus the
concepts underneath it.

This plan is written **for your current level** (from our conversation):

- The `packages/website` app is the only Astro project you've built, so Astro
  concepts are taught from the ground up — but scoped to what this code touches.
- Your ESM and module-resolution model is solid, so those get a light touch;
  we spend the time on the specific nuances you flagged as unknown.
- **One assumption we will deliberately overturn early:** you currently think the
  site is static HTML on the CDN with only `src/actions/index.ts` running on the
  server. It's the opposite — and seeing why is the foundation for everything
  else here. That's Module 1.

---

## 📌 Context for a resuming assistant (and useful for you too)

> If you are an AI assistant helping the user work through this plan **without
> the original conversation in context**, read this section first. It contains
> everything you need to run the quizzes and answer follow-ups accurately. If
> you're the learner, this is also a fair summary of what you're studying.

### What the code change under study actually was

The user's site (`packages/website`) is an Astro app deployed to Netlify.
Images imported and rendered via `astro:assets` `<Image>` were being served as
their original PNGs (~300 KB) instead of optimized WebP (~50 KB). We fixed that
so **every image defaults to WebP with no per-image prop**. Two files (plus a
revert):

1. **New — `packages/website/src/webp-netlify-image-service.ts`**: a custom Astro
   **external image service**. It spreads (`...`) the Netlify image service
   (`@astrojs/netlify/image-service.js`) and overrides `validateOptions` to set
   `options.format ??= 'webp'` (skipping SVG sources), then delegates to the
   original `validateOptions`. It has a **`export default`** (required by
   Astro's image-service loader) with a `// biome-ignore lint/style/noDefaultExport`
   comment, because the repo forbids default exports in `.ts` files but Astro's
   API mandates one here.

2. **Modified — `packages/website/astro.config.mjs`**: added an inline Astro
   **integration** named `defaultToWebpImages` whose `astro:config:setup` hook
   calls `updateConfig({ image: { service: { entrypoint } } })`, where
   `entrypoint` is an **absolute path** computed with
   `fileURLToPath(new URL('./src/webp-netlify-image-service.ts', import.meta.url))`.
   It is placed **last** in the `integrations` array on purpose (see ordering
   below).

3. **Reverted**: an earlier commit ("Make images smaller by using the webp
   format") that had added `format="webp"` to individual `<Image>` tags across 5
   `.mdx`/`.astro` files. We restored those files (`git checkout HEAD~1 -- …`)
   because the config-level default makes the per-image props redundant. That
   commit was already pushed to `origin/smaller-images`, so we did **not**
   rewrite history — the reverts sit as working-tree changes for the user to
   commit.

### Ground-truth facts (already verified from source — don't re-derive)

- `astro.config.mjs` has `output: 'server'` and **no** `prerender` exports
  anywhere → **all pages render on demand in a Netlify serverless function**,
  not as prebuilt static HTML. (The user initially believed the opposite; see
  below.)
- The **Netlify adapter** (`@astrojs/netlify`), unless `imageCDN: false`,
  replaces Astro's built-in **Sharp** image service with the **Netlify Image
  CDN** service (`@astrojs/netlify/image-service.js`).
- Astro's built-in **Sharp** service defaults output format to WebP
  (`DEFAULT_OUTPUT_FORMAT = "webp"` in `astro/dist/assets/consts.js`, via
  `resolveDefaultOutputFormat`). The **Netlify** service does **not** — its
  `getURL` only appends `&fm=<format>` if `options.format` is set, so no format
  ⇒ original format returned. That gap is the bug we fixed.
- **Integration ordering:** in `astro/dist/integrations/hooks.js`
  (`runHookConfigSetup`), the adapter is `unshift`ed to the front of the
  integrations list, so the adapter's `astro:config:setup` runs **first**.
  `updateConfig` deep-merges later calls on top of earlier ones. Therefore our
  integration must run **after** the adapter (i.e. be later in the array) for
  our `image.service.entrypoint` to win. This is why it's last.
- Astro loads the image service through a Vite **virtual module**
  (`virtual:image-service`) that resolves to `image.service.entrypoint` and
  reads its **default export** (`getConfiguredImageService` does
  `const { default: service } = await import('virtual:image-service')`). Hence
  the mandatory default export. Entrypoint resolution uses Vite's
  `this.resolve()`, which is why we pass an absolute path (a relative string's
  base would be ambiguous).

### The learner's profile (calibrate quizzes to this)

- `packages/website` is the **only Astro project they have ever built** — treat
  Astro concepts as near-beginner, but they understand this specific codebase.
- **Solid** on ESM basics and module resolution (bare vs. relative specifiers);
  the gaps they named were `import.meta.url`/`new URL` and how a *config path
  string* gets resolved.
- **Key misconception to watch for and correct:** they initially thought the
  site was static HTML on the CDN with only `src/actions/index.ts` running
  server-side. Reality: full SSR; pages run per request in the Netlify function.
  If this resurfaces in a quiz answer, correct it directly.
- Goal: **own and maintain this code** *and* gain **broad transferable
  concepts** — not exhaustive Astro mastery.

### How to run the quizzes

- The user triggers a checkpoint by saying **"quiz me on N"** (N = module
  number) or **"quiz me on the capstone."**
- When they do: ask **a few open-ended questions** (no multiple choice) that
  target that module's objectives (listed below). Let them answer in their own
  words. **Do not hand over the answer up front.** Assess their response, give
  targeted corrective feedback, and ask follow-ups on anything shaky before
  clearing them to continue.
- Keep it conversational and encouraging; the aim is for them to *explain* the
  ideas aloud.

### What each checkpoint should test (objectives)

- **Module 1** — build time vs. request time; static vs. `output: 'server'`;
  that our pages are SSR in a Netlify function; where each kind of code runs.
- **Module 2** — bare vs. relative resolution (recap); what `import.meta.url` is;
  what `new URL(rel, base)` + `fileURLToPath` produce; *why we pass a path string
  instead of `import`ing*, and why it's absolute.
- **Module 3** — what a bundler does (and that `.ts` sources don't exist as-is at
  runtime, but their code does, in server chunks); what an adapter is and why
  it's needed; what the Netlify adapter produces; adapters are also integrations.
- **Module 4** — `<Image>`/`astro:assets`; local (Sharp) vs. external (Netlify
  CDN) services; who does the pixel work and *when*; what determines the default
  format and why Netlify's differs (the root cause of the bug).
- **Module 5** — integrations/hooks; `astro:config:setup` timing; `updateConfig`
  merge semantics; `image.service.entrypoint`; the ordering rule and why our
  integration is last.
- **Module 6** — every API in the service file: type-only import,
  `ExternalImageService`, `isESMImportedImage` narrowing, spread-and-override,
  `validateOptions`, `??=`, the SVG guard, the non-null `!`, and the mandatory
  default export + the biome-ignore.
- **Capstone** — narrate the full build story and request story end to end;
  explain the pre-fix PNG behavior; explain why setting `image.service` directly
  in `defineConfig` (instead of via an integration) would fail.

---

## How to use this plan

Each module has four parts:

1. **Concepts** — short explanations to orient you.
2. **Why it matters here** — the tie-back to our actual code.
3. **Resources** — authoritative docs to read. All links were verified live on
   2026-07-26; if one ever 404s, search its title on the relevant docs site
   (<https://docs.astro.build>, <https://developer.mozilla.org>, etc.).
4. **Do this** — a hands-on exercise. All exercises are safe; where one changes
   code, do it on a throwaway branch (`git switch -c learning-scratch`) and
   `git restore .` when done.

### Quiz checkpoints

At the end of most modules you'll see:

> 🧠 **QUIZ CHECKPOINT N** — when you're ready, tell me *"quiz me on N"* and I'll
> ask you a few **open questions** (no multiple choice). Answer in your own
> words; I'll follow up on anything shaky before you move on.

Do the reading and the exercise **first**, then take the quiz. The goal is for
you to explain these ideas out loud, not to recognize them.

### Suggested order

Do the modules in order — each builds on the previous one. Rough time budget:
Modules 1–3 are the conceptual core (~spend the most time here); Modules 4–5
are our specific code; Module 6 is synthesis.

---

## Module 1 — The keystone: build time vs. request time, static vs. server

**This is the most important module. Everything else depends on it.**

### Concepts

Two completely different moments in a web app's life:

- **Build time** — when you run `astro build` (or start `astro dev`). Your
  config, integrations, and any transforms run **once**, on your machine or in
  CI. The output is a set of files.
- **Request time (runtime)** — when a real visitor's browser asks for a page.
  In a *server* app this runs code **again, per request**, on a host.

Astro has an `output` mode that decides which pages are which:

- `output: 'static'` (the default) → every page is rendered to `.html` **at
  build time** and served as a static file. No per-request server code.
- `output: 'server'` → pages render **per request** on a server, unless a
  specific page opts out with `export const prerender = true`.

**Our site is `output: 'server'` with no `prerender` anywhere.** So your current
mental model is inverted: the pages are *not* static files on the CDN — each
page runs server-side on every visit. (`src/actions/index.ts` is server code
too, but it is *not* the only server code — the pages themselves are.)

Where does that server code run? On a **serverless function** that the Netlify
adapter produces at build time (you saw it earlier under
`.netlify/v1/functions/ssr/…`). More on adapters in Module 3.

A mental table for our repo:

| Code | Runs when | Runs where |
|---|---|---|
| `astro.config.mjs` | build time, once | your machine / CI |
| our integration's `astro:config:setup` hook | build time, once | your machine / CI |
| a page like `src/pages/index.mdx` | **every request** | Netlify serverless function |
| `src/actions/index.ts` | every request (when called) | Netlify serverless function |
| the image **service** file | build time *and* request time (see Module 5) | both |

### Why it matters here

- Our integration hook runs **once at build**, not per request — that's why it
  can safely mutate config.
- The image **service** is part of the *server* bundle, so it *does* run at
  request time. (Your guess that it's "compile-time only" is the thing to
  revise — Module 5 nails this down.)
- The Netlify adapter exists precisely because pages need somewhere to *run* at
  request time.

### Resources

- Astro, *On-demand rendering (SSR)*:
  <https://docs.astro.build/en/guides/on-demand-rendering/>
- Astro, `output` config reference:
  <https://docs.astro.build/en/reference/configuration-reference/#output>

### Do this

1. Run `pnpm --filter website build` (or `cd packages/website && astro build`).
2. Look in `packages/website/dist/` — note there are **no page `.html` files**
   (only assets like `_astro/`, `images/`, sitemaps).
3. Now look under `packages/website/.netlify/` — find the `ssr` function
   directory. That directory *is* your server. Convince yourself the pages live
   there, not in `dist/` as HTML.

> 🧠 **QUIZ CHECKPOINT 1** — tell me *"quiz me on 1"* when ready.

---

## Module 2 — Module resolution, `import.meta.url`, and "why a URL instead of an import"

Your resolution model is already correct; this module fills the two specific
gaps you named.

### Concepts

**Recap (you have this right):**
- Bare specifier (`'@astrojs/netlify/image-service.js'`) → look in
  `node_modules`, walking up the directory tree.
- Relative specifier (`'./foo.ts'`) → resolve relative to the **file that
  contains the `import`**.

**Gap 1 — resolving a path *relative to the current file*, at runtime.**
When code needs to build a path relative to *itself* (not relative to wherever
the process happened to start), it uses `import.meta.url`:

- `import.meta.url` is the absolute URL of the *current module file*, e.g.
  `file:///Users/pavel/dev/accented/packages/website/astro.config.mjs`.
- `new URL('./src/foo.ts', import.meta.url)` resolves `./src/foo.ts` **against
  that file's location**, giving a `file://` URL to the target.
- `fileURLToPath(...)` converts that `file://` URL into a plain OS path string
  (`/Users/pavel/.../src/foo.ts`).

This is a *transferable* pattern — you'll see `import.meta.url` (and the older
CommonJS `__dirname`) all over config files and tooling.

**Gap 2 — why we didn't just `import` the service.**
Look at what we actually wrote:

```js
image: { service: { entrypoint: webpImageServiceEntrypoint } }
```

We didn't `import` the service. We handed Astro a **string that names where the
module is**. Astro (via Vite) imports it *later, internally*. So this is not an
ESM import at all — it's a *pointer* for another tool to resolve and load. You
can't express "load this eventually, in the server environment" with a static
`import` at the top of your config.

**Why an *absolute* path string and not `'./src/webp-...ts'`?**
Astro resolves that string with Vite's resolver (`this.resolve(entrypoint)`).
A relative string there is ambiguous — its base is *not* your `astro.config.mjs`
file; it depends on Vite's root / the current working directory, which you don't
fully control (think monorepo, running from repo root vs. package dir, CI).
Computing an absolute path from `import.meta.url` removes the ambiguity: it's
correct no matter where the build is launched from.

### Why it matters here

This is the direct answer to your "why a URL object instead of a regular import"
question — and to a subtle bug you'd hit if you'd used a bare relative string.

### Resources

- MDN, `import.meta`:
  <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import.meta>
- MDN, `URL()` constructor (note the `base` argument):
  <https://developer.mozilla.org/en-US/docs/Web/API/URL/URL>
- Node, `url.fileURLToPath`:
  <https://nodejs.org/api/url.html#urlfileurltopathurl-options>

### Do this

1. In a scratch file, `console.log(import.meta.url)` and
   `console.log(new URL('./src/webp-netlify-image-service.ts', import.meta.url))`
   and `console.log(fileURLToPath(new URL(...)))`. See the three forms.
2. Predict, then check: if `astro.config.mjs` used the string
   `'./src/webp-netlify-image-service.ts'` and you ran the build from the **repo
   root** vs. from `packages/website`, would the two behave the same? Why?

> 🧠 **QUIZ CHECKPOINT 2** — tell me *"quiz me on 2"* when ready.

---

## Module 3 — Bundling, adapters, and the Netlify adapter specifically

### Concepts

**Bundling.** A bundler (Astro uses **Vite**, which uses Rollup/esbuild under
the hood) takes your many `import`/`export` files and combines them into a
smaller number of output files ("chunks"), following the import graph. It also
tree-shakes (drops unused exports), and TypeScript is compiled away to JS. So:

- Your `.ts` source files do **not** exist as-is at runtime.
- But their *code* very much does — merged into `.mjs` chunks. The
  `webp-netlify-image-service_*.mjs` chunk you saw is your service, bundled.
- Correction to your guess: the service is **not** compile-time-only. It's
  compiled *and bundled into the server*, where it runs at request time.

**Adapter — the Astro-specific term.** An **adapter** is a plugin that teaches
`astro build` how to package the *server* part of your app for one specific host
(Netlify, Vercel, Node, Cloudflare, …). Different hosts run server code
differently (a Node server, an AWS-Lambda-style function, an edge worker), so
the adapter emits the right entrypoint, file layout, and config for that host.
No adapter → Astro can't produce server output, only static.

For us, `adapter: netlify()`:
- turns the server pages into a **Netlify serverless function** (that
  `.netlify/…/ssr` directory),
- wires up Netlify-specific features (redirects, sessions/blobs, and —
  importantly for us — **image handling**, Module 4).

**Adapters are also integrations.** Keep this in your back pocket: `netlify()`
returns an Astro *integration* object (Module 5 covers integrations). This is
why, in Module 5, the adapter and our integration can both touch config — and
why *order* matters.

### Why it matters here

- Explains the `.netlify/…/ssr` directory you didn't recognize.
- Explains why the service file is in a server chunk (bundling + adapter).
- The Netlify adapter is what swaps in the Netlify image service, which is the
  whole reason our WebP problem existed.

### Resources

- Astro, *Adapters / add an adapter*:
  <https://docs.astro.build/en/guides/on-demand-rendering/#server-adapters>
- Astro, **Netlify adapter** guide (read the whole page, esp. the image CDN
  section): <https://docs.astro.build/en/guides/integrations-guide/netlify/>
- Optional depth — Vite, *Building for Production*:
  <https://vite.dev/guide/build.html>

### Do this

1. Open `packages/website/.netlify/v1/functions/ssr/…/chunks/` and find the
   `webp-netlify-image-service_*.mjs` chunk. Read it. Notice it contains **both**
   Netlify's original service code *and* our wrapper — that's bundling.
2. In the Netlify adapter docs, find the `imageCDN` option. Read what turning it
   off would do. (You don't need to change anything.)

> 🧠 **QUIZ CHECKPOINT 3** — tell me *"quiz me on 3"* when ready.

---

## Module 4 — Astro's image pipeline: `<Image>`, image services, and the default format

### Concepts

**`astro:assets` and `<Image>`.** When you `import img from './x.png'` and render
`<Image src={img} />`, Astro doesn't ship the raw PNG. It runs the image through
an **image service** that can resize/reformat/optimize it, and emits an `<img>`
pointing at the processed result.

**Image service — two kinds:**
- **Local service** (e.g. Astro's built-in **Sharp** service): does the actual
  pixel work **at build time** using the `sharp` library, and writes optimized
  files. Great for static sites.
- **External service** (e.g. **Netlify Image CDN**): does *not* process pixels
  itself. It just **builds a URL** like
  `/.netlify/images?url=…&fm=webp&w=1364` and lets the host's image CDN do the
  transform **at request time**. This is what our site uses (because the Netlify
  adapter installed it).

**The default-format question (your specific ask).**
- Astro's **built-in Sharp service** defaults the output format to **WebP**
  (there's a constant, `DEFAULT_OUTPUT_FORMAT = "webp"`, applied in its
  `validateOptions`).
- The **Netlify** external service **does not default the format** — its
  `getURL` only adds `&fm=…` *if you passed `format`*. No `format` → no `fm` →
  Netlify returns the **original** format (your PNG). **This is the entire bug we
  fixed.**
- Where it's documented: the *Images* guide and the *Image Service API*
  reference describe the `format` option and the built-in default; the Netlify
  behavior lives in the Netlify adapter docs / the fact that it's an external
  service. (Reading the source, as we did, is often the fastest ground truth —
  Module 5 shows how.)

### Why it matters here

This module *is* the problem statement. Our fix = "restore a sensible default
format for the external Netlify service." You should be able to explain the
difference between the Sharp and Netlify services without notes.

### Resources

- Astro, *Images* guide: <https://docs.astro.build/en/guides/images/>
- Astro, **Image Service API** reference (local vs. external, `getURL`,
  `validateOptions`, `transform`):
  <https://docs.astro.build/en/reference/image-service-reference/>
- Netlify adapter guide, image CDN section (same link as Module 3).

### Do this

1. Read Astro's built-in default in
   `node_modules/astro/dist/assets/consts.js` (find `DEFAULT_OUTPUT_FORMAT`) and
   `.../utils/inferSourceFormat.js` (`resolveDefaultOutputFormat`).
2. Read Netlify's service in
   `node_modules/@astrojs/netlify/dist/image-service.js`. Find the line
   `if (options.format) query.set("fm", options.format)` and confirm for
   yourself that no `format` means no `fm`.

> 🧠 **QUIZ CHECKPOINT 4** — tell me *"quiz me on 4"* when ready.

---

## Module 5 — Astro integrations & the config lifecycle (our `astro.config.mjs`)

### Concepts

An **integration** is a plugin that hooks into Astro's lifecycle. It's an object:

```js
{ name: 'my-thing', hooks: { 'astro:config:setup': (ctx) => { … } } }
```

**Hooks** are named lifecycle moments Astro calls. The one we use,
**`astro:config:setup`**, runs **once at build/dev startup**, *before* the
config is finalized — the right place to adjust configuration.

**`updateConfig`** is a function Astro passes into that hook. Calling it
**deep-merges** a partial config into the run's config. We use it to set
`image.service.entrypoint` to our wrapper.

**`image.service.entrypoint`** is the config field naming *which module is the
image service*. Astro loads it lazily via a Vite "virtual module"
(`virtual:image-service`) whose default export is the service — which is exactly
why our service file needs a `default export`, and why we pass a path string
rather than importing it (Module 2).

**Ordering — the subtle part.** The Netlify adapter *also* sets
`image.service.entrypoint` (to Netlify's service) inside *its* `astro:config:setup`.
So why does ours win? Because:

- Astro runs integrations' `astro:config:setup` hooks **in array order**, and
- it **`unshift`s the adapter to the front** of that list (adapter runs first),
- and `updateConfig` merges *later* calls on top of earlier ones.

We placed our integration **last** in the `integrations` array, so it runs after
the adapter and its `updateConfig` overrides the adapter's entrypoint. If we'd
put it first, the adapter would clobber us.

### Why it matters here

This module explains every line of the `astro.config.mjs` change: the inline
integration object, the hook, `updateConfig`, the entrypoint field, and the
positioning comment about ordering.

### Resources

- Astro, **Integration API** reference (skim all hooks; read `astro:config:setup`
  and `updateConfig` carefully):
  <https://docs.astro.build/en/reference/integrations-reference/>
- Astro, *Configuring integrations*:
  <https://docs.astro.build/en/guides/integrations-guide/>

### Do this

1. Temporarily add `console.log('hook ran')` inside our hook and run a build.
   Confirm it prints **once** (build time), not per request.
2. Temporarily move `defaultToWebpImages` to the **front** of the `integrations`
   array, build, and inspect the built manifest's `image.service.entrypoint`
   (in a server chunk). Does it revert to Netlify's? Restore afterward. This
   makes the ordering rule concrete.

> 🧠 **QUIZ CHECKPOINT 5** — tell me *"quiz me on 5"* when ready.

---

## Module 6 — The service file, line by line

Open `packages/website/src/webp-netlify-image-service.ts` and make sure you can
justify **every token**.

### Concepts / APIs used

- `import netlifyImageService from '@astrojs/netlify/image-service.js'` — the
  external service we're extending (bare specifier → `node_modules`).
- `import type { ExternalImageService } from 'astro'` — a **type-only** import
  (erased at build; enforced by the repo's `useImportType` lint rule). It's the
  interface our object must satisfy (`getURL`, `validateOptions`, etc.).
- `import { isESMImportedImage } from 'astro/assets/utils'` — a helper that
  **narrows** `options.src` (which is `ImageMetadata | string`) to the
  imported-image object, so `.format` is safe to read. (This is TypeScript type
  narrowing — worth a look if that phrase is fuzzy.)
- `const service: ExternalImageService = { ...netlifyImageService, … }` — the
  **spread** copies all of Netlify's methods, then we override one. This is the
  "decorator/wrapper" pattern: reuse everything, change one behavior.
- `validateOptions(options, imageConfig) { … }` — the hook Astro calls to
  normalize options *before* `getURL`. We set the default here so it flows into
  the URL.
- `options.format ??= 'webp'` — **nullish-coalescing assignment**: assign only
  if `format` is `null`/`undefined`. Preserves an explicit `format` (e.g.
  `format="avif"`) — that's why overrides still work.
- the SVG guard — don't force-convert vector SVGs to WebP.
- `return netlifyImageService.validateOptions!(options, imageConfig)` — delegate
  to the original for the rest of its validation. The `!` is a **non-null
  assertion** (the type marks `validateOptions` optional, but we know Netlify's
  service defines it).
- `export default service` — required by Astro's virtual-module loader
  (Module 5); the `// biome-ignore lint/style/noDefaultExport` comment documents
  *why* we break the repo's "no default exports" rule here (the API forces it).

### Why it matters here

This is the payload — the actual behavior change. Everything in Modules 1–5
exists to explain how this file gets loaded and run.

### Resources

- MDN, *Logical nullish assignment (`??=`)*:
  <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing_assignment>
- MDN, *Spread syntax*:
  <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax>
- TypeScript handbook, *Narrowing* and *Non-null assertion*:
  <https://www.typescriptlang.org/docs/handbook/2/narrowing.html>
- The two source files from Module 4's exercise (Netlify's `getURL` is where our
  defaulted `format` becomes `&fm=webp`).

### Do this

1. Trace one call by hand: a prop-less `<Image src={pngImport} />` →
   `validateOptions` (we set `format='webp'`) → Netlify's `getURL`
   (adds `&fm=webp`). Write the final URL on paper, then verify against the
   experiment we ran earlier (re-run it if you like).
2. Predict what happens for `<Image src={svg} />` and for
   `<Image src={png} format="avif" />`, then confirm from the code.

> 🧠 **QUIZ CHECKPOINT 6** — tell me *"quiz me on 6"* when ready.

---

## Module 7 — Capstone synthesis

No new material — prove you own it.

### Do this (write these out, then we'll discuss)

1. **The build story.** Narrate what happens from `astro build` to the deployed
   function: config loads → integrations' `astro:config:setup` run (order! which
   wins for the image service?) → pages + service get bundled → Netlify adapter
   emits the function. Where does our service end up, and why?
2. **The request story.** Narrate a visitor loading the homepage: function runs
   the page → `<Image>` calls the configured service's `validateOptions` then
   `getURL` → browser receives an `<img>` with a `/.netlify/images?…&fm=webp…`
   URL → Netlify's image CDN transforms and returns WebP. Which parts are
   build-time vs. request-time?
3. **The counterfactual.** Explain, in two sentences each: (a) why the images
   were PNG before our fix, and (b) why setting `image.service.entrypoint`
   directly in `defineConfig` (instead of via an integration) would *not* have
   worked.

> 🧠 **FINAL QUIZ** — tell me *"quiz me on the capstone"* when ready. I'll push a
> bit harder here and connect threads across modules.

---

## Quick reference: the files involved

- `packages/website/astro.config.mjs` — the inline `defaultToWebpImages`
  integration + entrypoint path.
- `packages/website/src/webp-netlify-image-service.ts` — the wrapper service.
- `node_modules/@astrojs/netlify/dist/image-service.js` — the service we extend.
- `node_modules/astro/dist/assets/` — Astro's built-in service, consts, and the
  virtual-module plumbing (`vite-plugin-assets.js`, `services/`, `consts.js`).

Work through it at your pace. Ping me with *"quiz me on N"* whenever you want a
checkpoint.

# Learning Plan: Understanding the Website Performance Changes

Five modules, each tied to a change or decision on the `stage-preview-all-branches` branch (see
`PERFORMANCE-CHANGES.md`). The goal is to understand those changes and pick up transferable knowledge along the way,
not to master each topic.

Each module has **Concepts**, **Why it matters here**, **Resources** and **Do this**. Exercises that change code are
meant for a throwaway branch (`git switch -c learning-scratch`, then `git restore .` when done). Every module ends with a
quiz checkpoint: say *"quiz me on N"* and you'll get a few open questions to answer in your own words.

Do Module 1 first; Modules 2, 4 and 5 lean on it. All links were checked on 2026-10-05.

---

## Module 1 — From HTML to first paint

### Concepts

**The browser doesn't wait for the whole HTML.** It parses bytes as they arrive and builds the DOM incrementally. It
can paint the top of the page before the bottom has even been downloaded, as long as nothing is *blocking rendering*.

**Render-blocking stylesheets.** A `<link rel="stylesheet">` in the `<head>` doesn't stop the parser, but the browser
won't paint anything until that stylesheet has been downloaded and parsed. Otherwise it would paint unstyled content
and then repaint it. A classic `<script>` that comes after a pending stylesheet also waits for it, because the script
might read styles. So each external stylesheet costs at least one network round trip before first paint. An inline
`<style>` costs nothing extra; it arrives with the HTML.

**Scripts — four flavors:**

| | Downloads | Runs | Blocks the parser? |
|---|---|---|---|
| `<script src>` (classic) | when encountered | immediately | **yes** |
| `<script defer src>` | in parallel | after parsing, in document order | no |
| `<script async src>` | in parallel | as soon as it arrives, any order | no (pauses briefly to run) |
| `<script type="module">` | in parallel, with its static imports | like `defer` (or `async` if marked) | no |

All of our scripts are modules, so none of them block rendering.

**The preload scanner.** While the main parser is busy, a lightweight secondary parser reads ahead in the raw HTML and
starts fetching what it can see in the markup: stylesheets, scripts, `<img src/srcset>`. That's why an image in the HTML
often starts downloading before the parser reaches it.

**What the preload scanner can't discover:**
- **Fonts.** An `@font-face` rule only *declares* a font. The browser requests the file only after it has computed
  styles and found text that needs that family (and those characters — Module 4). Even with inline CSS, a font
  request is therefore always one step after the HTML.
- **`loading="lazy"` images.** The browser has to lay the page out to know whether the image is near the viewport, so
  it can't fetch it straight from the markup. Lazy images also start at low priority.

**`fetchpriority`.** A hint (`high`/`low`/`auto`) that reorders requests competing for the same connection. It
doesn't make anything download faster; it changes *who goes first*. Moving one request earlier moves another one
later.

### Why it matters here

- **Inlining the CSS (`9cf01db`)** removed the only render-blocking requests. The page can paint as soon as enough
  HTML has arrived.
- **The font "chain"** in Lighthouse's network dependency tree can't be flattened. Fonts are discovered by styling text,
  not by reading markup. Inline CSS makes that happen early, which is why the fonts finished at about the same time as
  the HTML.
- **The `priority` experiment** on the home page: removing `loading="lazy"` saved about 30 ms of discovery delay,
  but `fetchpriority="high"` pushed about 55 KB of images ahead of the fonts. On a slow connection, that made the
  simulated LCP worse. That's the zero-sum nature of priorities.

### Resources

- web.dev, *Understand the critical path*: <https://web.dev/learn/performance/understanding-the-critical-path>
- MDN, *Critical rendering path*:
  <https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Critical_rendering_path>
- web.dev, *Don't fight the browser preload scanner*: <https://web.dev/articles/preload-scanner>
- MDN, `<script>` (read the `async`, `defer` and `type="module"` sections):
  <https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script>
- web.dev, *Browser-level image lazy loading*: <https://web.dev/articles/browser-level-image-lazy-loading>
- web.dev, *Optimize resource loading with the Fetch Priority API*: <https://web.dev/articles/fetch-priority>

### Do this

1. Open the stage site's home page in Chrome with DevTools → Network, set throttling to *Slow 4G*, disable the cache
   and reload. Add the *Initiator* and *Priority* columns. For each request, ask: who discovered it — the parser, the
   preload scanner, a script, or the CSS? When does each font start relative to the HTML finishing? What's the priority
   of the two comparison images?
2. Record a reload in DevTools → Performance. Find the first paint (FCP) marker and check whether it comes before the
   HTML request has finished.
3. Predict, then check on a scratch branch: if you add a classic `<script src>` that points at a slow URL into the
   `<head>`, what happens to first paint? What if you add `defer`?

> 🧠 **QUIZ CHECKPOINT 1** — tell me *"quiz me on 1"* when ready. (Covers: incremental parsing, render-blocking CSS,
> the four script flavors, the preload scanner, and when fonts and lazy images get requested.)

---

## Module 2 — How Astro handles CSS

### Concepts

**A CSS import in frontmatter is a declaration, not an action.** The frontmatter runs at build time (or on the server)
and never reaches the browser. `import '~/assets/styles/global.css';` there doesn't inline or link anything. It tells
Astro "pages using this component need this CSS". The same goes for `import '@fontsource-variable/lora';` and for
`<style>` blocks inside `.astro` components (which Astro scopes to the component).

**Astro (via Vite) collects and bundles it.** At build time Astro gathers the CSS for each page from every component in
that page's tree. Vite then bundles it into stylesheet files: CSS shared by many pages goes into one file (ours was
named after `MainLayout`), and page-specific CSS goes into smaller ones.

**`build.inlineStylesheets` decides, for each bundled stylesheet, how it reaches the page:**
- `'never'` → always a `<link>` to the file.
- `'auto'` (the default) → inline it as a `<style>` if it's smaller than `vite.build.assetsInlineLimit` (4 KB by
  default), otherwise a `<link>`.
- `'always'` → always inline.

**`?url` is a way out of that pipeline.** `import globalCss from '...global.css?url'` is a Vite feature: "emit this
file as an asset and give me its URL as a string". Astro no longer sees it as page CSS. It isn't bundled with the rest,
and `inlineStylesheets` never applies to it. The hand-written `<link href={globalCss}>` was the only reason it ended up
on the page.

**What the build actually produced** (measured by rebuilding each variant):

| Variant | What a page got |
|---|---|
| **A. Before `9cf01db`** (`?url` + manual `<link>`, `'auto'`) | 2 `<link>`s: `global.css` (5.2 KB) and `MainLayout.css` (10.6 KB) + a small inline `<style>` (1.6–2.7 KB, page-specific) |
| **B. Plain import only** (`'auto'`) | 1 `<link>`: `MainLayout.css` (15.8 KB: both merged) + the same small inline `<style>` |
| **C. Now** (plain import + `'always'`) | 0 `<link>`s; one `<style>` of 17–18 KB |

So, to your question about other CSS: **yes**. `MainLayout.css` was also render-blocking. Most of it (about 9.5 KB)
was the 24 Fontsource `@font-face` rules; the rest was component styles. Only the small page-specific chunk was already
inlined, because it was under 4 KB. Neither change alone would have removed every `<link>`: the plain import brought
`global.css` into the pipeline, and `'always'` inlined the result.

**The trade-off.** A linked stylesheet is cached once and reused across pages; inline CSS is downloaded again with
every page. For us that's about 3.3 KB extra per page after Brotli compression. That's a good deal compared to a
render-blocking round trip, but it would stop being one if the CSS grew a lot.

### Why it matters here

This is the whole of `9cf01db`, and the reason it takes two lines (one per pipeline step) instead of one.

### Resources

- Astro, *Styles and CSS* (especially the *Production* and bundle-control sections):
  <https://docs.astro.build/en/guides/styling/>
- Astro, configuration reference → `build.inlineStylesheets`:
  <https://docs.astro.build/en/reference/configuration-reference/>
- Vite, *Static Asset Handling* → explicit URL imports (`?url`): <https://vite.dev/guide/assets.html>
- Vite, *Build options* → `build.assetsInlineLimit`: <https://vite.dev/config/build-options.html>
- Source, if you want ground truth: `node_modules/astro/dist/core/build/plugins/plugin-css.js` (search for
  `inlineConfig`).

### Do this

1. Reproduce the table on a scratch branch. For each variant, run `pnpm website:build` and inspect `dist/index.html`
   (`<link rel="stylesheet">` vs `<style>`) and `dist/_astro/*.css`. Variant B: delete the `inlineStylesheets` line.
   Variant A: also restore the `?url` import and `<link>` (see `git show 9cf01db`).
2. In variant A, open `MainLayout.*.css` and identify what's inside it. Then find the small inline `<style>` and work
   out where *that* CSS comes from.
3. Predict, then check: in variant B, what happens if you set `vite.build.assetsInlineLimit` to `20000`?

> 🧠 **QUIZ CHECKPOINT 2** — tell me *"quiz me on 2"* when ready. (Covers: CSS imports as declarations, per-page
> collection and bundling, the three `inlineStylesheets` values, what `?url` does, and the caching trade-off.)

---

## Module 3 — Bundlers and code splitting

### Concepts

**What a bundler does with imports.** Vite (Rollup under the hood) starts from each entry point — for us, each
`<script>` in an `.astro` file — and follows the import graph:
- A **static** `import x from '...'` is merged into the same output file (*chunk*). The bundler knows at build time
  that it's needed.
- A **dynamic** `import('...')` is a **split point**. The target becomes a separate chunk, fetched only when that line
  runs. That's the point of `import()`: lazy loading.
- A chunk loaded via `import()` can only be discovered once the code calling it runs. That's the HTML → script → chunk
  chain Lighthouse complained about.

**Why "load by name" means `import()`.** `createHighlighter({ langs: ['js'] })` takes a *string*. At build time, the
bundler can't know which strings your code will pass. So any library that loads things by name has to ship a registry
of lazy loaders. Shiki's full bundle has 242 language entries like
`"import": () => import("@shikijs/langs/abap")`, a similar map for themes, and
`createOnigurumaEngine(import("shiki/wasm"))` for the regex engine. The bundler must emit a chunk for *every* entry
(about 400 files in our old `dist/_astro`), even though the browser only fetches the four it actually needs. This
isn't a Shiki quirk; it applies to any API that loads things by string: i18n message loaders, icon sets, route
tables, plugin systems.

**Passing values instead of names.** The fine-grained API takes the grammar, theme and engine as *module objects*
that you import statically. The bundler can see exactly what's used, so it merges just that into one chunk. You trade
flexibility (no picking a language at runtime) for a smaller, flatter bundle.

**The regex engine.** TextMate grammars are written for the Oniguruma regex library. Shiki's default engine is
Oniguruma compiled to WebAssembly, and the `shiki/wasm` chunk was a JS module embedding that binary (185 KB
compressed). The JavaScript engine instead translates the patterns into native `RegExp`. It's tiny, and it supports
almost all grammars, including JS.

**Package `exports` maps** (why the `.mjs` was needed). A package's `package.json` `exports` field controls which paths
you can import from it. Shiki has `"./*": "./dist/*"`, which maps `shiki/langs/javascript.mjs` to
`dist/langs/javascript.mjs` *literally*. Node and TypeScript don't add extensions after that mapping. Vite does,
which is why the grammar import built fine without `.mjs` but failed `astro check`. The theme import also failed
the build, because Node loads `astro.config.mjs` (which imports `starterCodeUtils.ts`) directly.

### Why it matters here

This explains `03c0ebe`: the old code asked for things by name, so Shiki had to load them with `import()`. The new
code passes the modules themselves, so everything is bundled into one chunk. It also explains the much smaller build
output and the `.mjs` question.

### Resources

- MDN, `import()`: <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import>
- Rollup tutorial → *Code Splitting* section: <https://rollupjs.org/tutorial/>
- Vite, *Features* → dynamic import and async chunk loading: <https://vite.dev/guide/features.html>
- Shiki, *Bundles* (full vs web vs fine-grained): <https://shiki.style/guide/bundles>
- Shiki, *Regex Engines*: <https://shiki.style/guide/regex-engines>
- Node, *Packages* → `exports` and subpath patterns: <https://nodejs.org/api/packages.html>

### Do this

1. Read `node_modules/shiki/dist/bundle-full.mjs` (about 30 lines) and skim `langs-bundle-full-*.mjs`. Find the
   `import()` calls; together, they explain the old build.
2. On a scratch branch, check out `03c0ebe^` and build. Count the files in `dist/_astro`, then grep the
   `StarterCode*.js` chunk for `import(`. Do the same on the current code.
3. Predict, then check: if you added `'css'` to `langs` in the fine-grained version, what would you need to change,
   and would it create a new chunk?
4. Optional: add `rollup-plugin-visualizer` temporarily and look at what's inside the `StarterCode` chunk now.

> 🧠 **QUIZ CHECKPOINT 3** — tell me *"quiz me on 3"* when ready. (Covers: static vs dynamic imports in a bundle,
> split points and request chains, why load-by-name APIs need `import()`, the WASM vs JS regex engine, and `exports`
> maps.)

---

## Module 4 — Web fonts from scratch

### Concepts

**What's in a font file.** Mainly:
- **Glyphs**: vector outlines, one per drawn shape.
- **A character map** (`cmap`): which glyph to draw for which Unicode character.
- **Metrics**: advance widths, ascent and descent, line gap.
- **Layout data**: kerning, ligatures, OpenType features.

**WOFF2** is the web packaging: the same data, compressed with Brotli. It's the only format you need today.

**Static vs variable fonts.** Traditionally, every style is its own file: Regular, Medium, Bold and Bold Italic are
four downloads. A **variable font** stores the outlines once, plus *deltas* that describe how each point moves along
one or more **axes**:
- `wght` — weight;
- `wdth` — width;
- `ital` — italic;
- `slnt` — slant;
- `opsz` — optical size.

The browser can pick any value in an axis's range, e.g. `font-weight: 450`.

**Why `standard-italic` is heftier than `wght-italic`.** Every axis adds delta data for every glyph. IBM Plex Sans's
"standard" files have two axes (weight and width); the `wght` files have one. Same glyphs, less variation data:
75.8 KB → 50.2 KB for the latin italic. We never set `font-stretch`, so the width axis was dead weight. That's
what "standard" means in Fontsource's naming for this family. It isn't a universal term: other families have
different axes.

**`@font-face`, descriptor by descriptor.** Each rule declares *one file* and the range it covers:
`font-family` (the name you use in CSS), `src`, `font-style`, `font-weight: 100 700` (a range, because it's
variable), `font-stretch` (only on width-axis files), `unicode-range`, `font-display`. The browser matches text against
these descriptors to choose a face.

**Subsetting and `unicode-range`.** Fontsource splits each style into files per script — latin, latin-ext, cyrillic,
greek, vietnamese… — each with a `unicode-range`. The browser downloads a file only if the page contains characters
in its range. That's why we have 24 `@font-face` rules but pages usually fetch one file per style. It's also why a
single `<em>` on `/api` triggered the whole italic download.

**`font-display`.** Fontsource uses `swap`: text renders immediately in a fallback font, then switches to the web font
once it's loaded. So fonts don't block first paint, but the swap can shift layout.

**Further optimizations, so you can judge them when you see them:**
- **Preloading** (`<link rel="preload" as="font">`): starts the download earlier. We measured that it would barely
  help us (Module 1).
- **Custom subsetting** (`pyftsubset`, glyphhanger): strip characters or features you never use, below Fontsource's
  per-script granularity.
- **Instancing**: narrow an axis range (e.g. weight 400–600 instead of 100–700) to drop delta data.
- **Fallback metric overrides** (`size-adjust`, `ascent-override`, …): make the fallback font take the same space as
  the web font, so the swap doesn't shift layout.
- **System font stacks**: zero downloads, at the cost of the look.

### Why it matters here

This explains `e731d44`: why a one-word change cut a third of the italic download without visibly changing anything,
and which further optimizations would be worth trying if fonts ever become the bottleneck again.

### Resources

- Google Fonts Knowledge, *Introducing variable fonts*:
  <https://fonts.google.com/knowledge/introducing_type/introducing_variable_fonts>
- MDN, *Variable fonts guide*: <https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Fonts/Variable_fonts>
- MDN, `@font-face` (and its `unicode-range` and `font-display` pages):
  <https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face>
- web.dev, *Optimize web fonts*: <https://web.dev/learn/performance/optimize-web-fonts>
- web.dev, *Best practices for fonts*: <https://web.dev/articles/font-best-practices>
- Chrome, *Improved font fallbacks* (metric overrides): <https://developer.chrome.com/blog/font-fallbacks>
- Fontsource, *Variable fonts*: <https://fontsource.org/docs/getting-started/variable>

### Do this

1. Drag `node_modules/@fontsource-variable/ibm-plex-sans/files/ibm-plex-sans-latin-standard-italic.woff2` and the
   matching `-wght-italic.woff2` into <https://wakamaifondue.com>. Compare their axes and character sets.
2. Read `node_modules/@fontsource-variable/ibm-plex-sans/wght-italic.css`. Pick one `@font-face` rule and explain each
   descriptor in it.
3. In DevTools → Network (filter: Font), load `/api` and then `/how-it-works`. Which font files does each page fetch,
   and why does `/api` fetch the italic one?
4. Predict, then check: if a blog post contained a Cyrillic word in italics, which additional file would load?

> 🧠 **QUIZ CHECKPOINT 4** — tell me *"quiz me on 4"* when ready. (Covers: what's in a font file, variable fonts and
> axes, why `standard` is bigger than `wght`, `@font-face` descriptors, `unicode-range` subsetting, `font-display`, and
> the optimization menu.)

---

## Module 5 — Reading Lighthouse critically

### Concepts

**Lab vs. field data.** *Lab* data (Lighthouse, PageSpeed Insights' diagnostics) comes from one synthetic load under
fixed conditions. *Field* data comes from real Chrome users over 28 days (the Chrome UX Report, CrUX), reported at
the 75th percentile. PageSpeed Insights shows field data at the top when a site has enough traffic. Field data is the
truth about users; lab data is a repeatable tool for diagnosis.

**Simulated throttling (Lantern).** By default, Lighthouse does *not* load your page over a slow connection. It loads
it at full speed, records which requests depended on which, and then *simulates* that graph on a slow mobile
connection (about 150 ms round trip, about 1.6 Mbps, CPU slowed 4×). The reported metrics are estimates from that
simulation; the actual load's numbers appear as `observed*` values in the JSON report. That's how our `priority`
experiment got LCP 142 → 129 ms observed but 1,731 → 1,967 ms simulated. In the simulation, bandwidth was scarce,
so request order mattered.

**Metrics vs. insights.** The score comes from five weighted metrics (FCP, LCP, TBT, CLS, Speed Index). Everything
else, including "Improve image delivery" and "Network dependency tree", is an *insight*: a heuristic advisory,
marked "Unscored". An insight can be wrong for your page, and fixing it won't necessarily change any metric.

**Insights are code you can read.** They come from Chrome DevTools' trace engine. "Improve image delivery" divides the
file's bytes by the source pixels recorded in *paint events*. If a paint records almost no pixels, the "savings"
equal the whole file: our compression false positive. The responsive-size check can also use a displayed size that
ignores the emulated pixel density: our 640w-vs-348px false positive.

**Variability and fair comparisons.** Results vary from run to run (network, CPU load, extensions). To compare two
versions: same machine, same conditions, alternate the runs (A, B, A, B…), several runs each, compare medians, and
look at both simulated and observed values and at the request list, not just the score.

### Why it matters here

Every "not addressed" item in `PERFORMANCE-CHANGES.md` was decided this way. Two warnings turned out to be heuristics
misfiring. One recommendation (`priority`) was measured and turned out to hurt. The network-tree warning describes a
structural minimum, not a defect.

### Resources

- web.dev, *Why lab and field data can be different*: <https://web.dev/articles/lab-and-field-data-differences>
- PageSpeed Insights, *About*: <https://developers.google.com/speed/docs/insights/v5/about>
- Lighthouse, *Performance scoring*: <https://developer.chrome.com/docs/lighthouse/performance/performance-scoring>
- Lighthouse docs, *Throttling*: <https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md>
- Lighthouse docs, *Score variability*: <https://github.com/GoogleChrome/lighthouse/blob/main/docs/variability.md>
- Chrome, insight pages for the three we hit:
  <https://developer.chrome.com/docs/performance/insights/image-delivery>,
  <https://developer.chrome.com/docs/performance/insights/network-dependency-tree>,
  <https://developer.chrome.com/docs/performance/insights/lcp-discovery>
- Source of the image insight:
  <https://github.com/ChromeDevTools/devtools-frontend/blob/main/front_end/models/trace/insights/ImageDelivery.ts>

### Do this

1. Run the same stage URL in PageSpeed Insights, the DevTools Lighthouse panel and the CLI
   (`npx lighthouse <url> --output=json --output-path=lh.json`). Compare the metrics and the list of insights. Which
   differ, and why might they?
2. In `lh.json`, open `audits.metrics.details.items[0]` and compare `largestContentfulPaint` with
   `observedLargestContentfulPaint`. Explain the gap.
3. Read `ImageDelivery.ts` (about 200 lines) and find the exact formula behind "Increasing the image compression
   factor…". Explain how it could report savings equal to the whole file.
4. Run Lighthouse five times on one URL and note the spread of LCP values. How many runs would you trust for an A/B
   comparison?

> 🧠 **QUIZ CHECKPOINT 5** — tell me *"quiz me on 5"* when ready. (Covers: lab vs field, simulated vs observed
> metrics, metrics vs insights, reading an insight's source to judge a warning, and how to run a fair before/after
> comparison.)

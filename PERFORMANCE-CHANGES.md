# Website loading performance: what we changed and what we left alone

Branch: `stage-preview-all-branches`. Lighthouse names below are the insight titles in Lighthouse 13 / PageSpeed Insights.

## Changes

| Commit | Change | Lighthouse issue it addresses |
|---|---|---|
| `ef01f6f` | Every branch except `main` deploys to the stage site. | None directly. Makes it possible to run PageSpeed Insights on a branch before merging. |
| `9cf01db` | All CSS is inlined into each page (`build.inlineStylesheets: 'always'`, and `global.css` imported as a module instead of linked manually). | **Render-blocking requests**: no stylesheet has to be downloaded before the first paint. |
| `ed78aba` | All content images use `layout="constrained"` instead of `full-width`. | None directly. Makes the image setup consistent and keeps images from being stretched past their natural size. It's also what the `sizes` change below relies on. |
| `1ad8726` | Content images get an accurate `sizes` attribute (`contentImageSizes`), calculated from the same layout values that the CSS uses (`src/layout-tokens.ts`). | **Improve image delivery** ("This image file is larger than it needs to be… Use responsive images"): browsers pick smaller files from `srcset`, e.g. 640w instead of 1280w on a 1280px desktop screen. |
| `03c0ebe` | The client-side Shiki highlighter (`StarterCode`) uses the fine-grained API: grammar, theme and JS regex engine are imported statically. | **Network dependency tree** ("Avoid chaining critical requests"): removes the HTML → script → 4 dynamically imported chunks chain. Also removes about 200 KB of JavaScript (mostly a WASM regex engine) and about 400 unused grammar and theme chunks from the build output. |
| `e731d44` | IBM Plex Sans italic switched from `standard-italic.css` (weight + width axes) to `wght-italic.css` (weight axis only). | **Network dependency tree**: this font file was the slowest link (74 KiB, shown in red); it's now 49 KiB. Every italic subset is 31–39% smaller. Italic rendering is unchanged, apart from sub-pixel antialiasing. |

## Issues we decided not to address

| Lighthouse issue | Why we left it |
|---|---|
| **Network dependency tree**: HTML → fonts and scripts | This is already as flat as it can be: each request is one step from the HTML. A font can only be requested once text using it is styled. Since the CSS is inline, that happens while the HTML is still arriving, so fonts finish at about the same time as the HTML. Preloading fonts would gain a few milliseconds at most, and would make every page download every font. |
| **LCP request discovery** on the home page ("LCP resources should not use `loading=lazy`", "`fetchpriority=high` should be applied") | Measured: 7 simulated mobile Lighthouse runs per variant. With `priority` on both comparison images, simulated LCP got *worse* (1,967 ms vs 1,731 ms median), because about 55 KB of images then compete with the fonts for bandwidth. Unthrottled LCP improved by only 13 ms. The lazy images are already requested early, because the CSS is inline. Adding the props would also mean deciding per page which images are above the fold. |
| **Improve image delivery**: "Increasing the image compression factor could improve this image's download size" (DevTools Lighthouse, home page) | Looks like a false positive. It claimed the whole file (28.8 KiB) could be saved, which is impossible. The image is 0.076 bytes per pixel, well under Lighthouse's threshold of about 0.167. This happens when Lighthouse records a paint with almost no source pixels. It didn't reproduce in local Lighthouse runs, and PageSpeed Insights doesn't report it. |
| **Improve image delivery**: "larger than it needs to be (640x605) for its displayed dimensions (348x329)" (Lighthouse CLI, mobile) | A false positive from the local CLI run, not reported by PageSpeed Insights. The comparison leaves out the emulated 1.75× pixel density: 348 × 1.75 ≈ 609 device pixels, so 640w is the correct pick. |

## Related findings (not Lighthouse issues)

- **WebP was never the problem in production.** Netlify Image CDN already serves WebP (or AVIF) when the URL has no `fm` parameter, based on the browser's `Accept` header. Building WebP files at build time (`imageCDN: false`, explored on `smaller-images`) wouldn't speed anything up.
- **Some screenshots are low resolution.** `host-app-ui.png` (708px) and the console screenshots (~1080px) look soft on 2× screens. That's a quality issue, not a performance one; fixing it means re-capturing them.

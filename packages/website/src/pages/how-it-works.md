---
layout: ../layouts/DocsLayout.astro
---

# How it works

This document discusses how Accented works under the hood,
why it’s built in a certain way,
and what limitations it has.

## Design principles (TODO)

- Make it performant. TODO: runtime performance, with link to relevant section.
- Minimize DOM changes.
- Make it accessible. (colors, keyboard, etc.) (link to the Accessibility page).
- Make it work on every web page. (supports latest web technologies)
- Support only latest browsers. (link to the browser support page)

## Performance

Accented strives to affect the host application’s performance
as little as possible,
but it runs on the main thread,
and some of its operations may still take hundreds of milliseconds
(especially on pages with lots of elements).

Accented keeps a [mutation observer](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)
active until Accented is explicitly disabled (TODO: link to the relevant place in the API docs).
On every DOM mutation, two things happen:

1. Accented runs axe-core to check for accessibility issues.
2. Accented makes necessary updates to the DOM to ensure that all issue highlights are up to date.

TODO: describe what Accented itself does to improve performance.

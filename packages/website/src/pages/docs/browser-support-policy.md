---
layout: ../../layouts/DocsLayout.astro
---

# Browser support policy

Accented aims to support the **2 latest major versions** of **Chrome, Safari, and Firefox.**

Specifically for **Safari** (the only major browser in which minor versions differ in the level of Web Platform feature support),
**2 latest minor versions** will be supported **within each supported major version.**
For example, if 18.5 is the latest version, Accented will support 17.5, 17.6, 18.4, and 18.5.

Accented has a suite of [Playwright](https://playwright.dev/) tests that run in the latest Chrome, Safari, and Firefox before a new version of the library is published.

Accented maintainers may explicitly choose to remove fallback code for a modern browser feature as soon as all supported browsers support such a feature.
We assume that most developers keep their development browsers up to date.
At the same time, if the major browser version is tied to the OS version (as is the case with Safari),
staying up to date may be more challenging,
hence the necessity to support a browser that may be more than a year old.

---
layout: ../../layouts/DocsLayout.astro
---

# Accessibility statement

Accented adds its own user interface elements to a host application:
for each element with accessibility issues within the host application,
it adds a button which opens a dialog with issue descriptions.

We strive to make those elements as accessible as possible.

- Elements added by Accented are easy to navigate with keyboard only.
- Elements have logical semantic structures.
- Interactive elements (including links and buttons) have meaningful names.
- Language of elements (currently only English) is properly specified.
- Color combinations have sufficient contrast.
- Interactive elements are large enough for touch navigation,
  and no content is presented only on hover.
- Content can be resized without requiring horizontal scrolling.
- Browser font size settings are respected (all font sizes are defined in `em` / `rem` units).

We take accessibility seriously, using [WCAG 2.2](https://www.w3.org/TR/WCAG22/) (level AA) as the baseline
and going beyond it to follow relevant best practices and community feedback.

If you encounter an accessibility issue within Accented itself or have suggestions,
please open [an issue on GitHub](https://github.com/pomerantsev/accented/issues)
or contact Pavel directly at [hello@pavelpomerantsev.com](mailto:hello@pavelpomerantsev.com).

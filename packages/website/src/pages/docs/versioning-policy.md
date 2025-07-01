---
layout: ../../layouts/DocsLayout.astro
---

# Versioning policy

Accented strives to adhere to [SemVer](https://semver.org/).

In practice, here’s how we decide whether to make a major, minor, or patch version bump.

**Major:**

- A breaking API change.

**Minor:**

- A non-breaking (additive) API change.
- A change in behavior that’s not a bug fix (for example, when Accented starts reporting a new class of issues).

**Patch:**

- A bug fix.
- A performance improvement.
- A UI improvement.
- A runtime or build-time dependency bump (presuming that an upgrade of a build-time dependency, such as TypeScript, may affect the code that’s surfaced to consumers).
- A fix in the Readme that's published on NPM.

**No version change:**

- Bumping a dependency that only affects the development or testing workflow (for example, JSDOM).

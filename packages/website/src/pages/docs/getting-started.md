---
layout: ../../layouts/DocsLayout.astro
---

# Getting started

Here’s how to get started with Accented.

## Install

You have two main options for installing Accented.

- As an NPM module (if you’re using a bundler).
- From an ES module registry (no build step required).

### NPM

Install with NPM (or with another package manager, such as PNPM or Yarn).

```
npm install --save-dev accented
```

Then import the package.

```
import { accented } from 'accented';
```

### ES module registry

If you prefer to load Accented without a build step, consider using [esm.sh](https://esm.sh/) as a CDN:

```
import { accented } from 'https://esm.sh/accented';
```

## Run in development mode

Run Accented in development only.

You can achieve it differently depending on your frontend build or server setup.

For example, for Vite, it may look like this:

```
if (import.meta.env.MODE === 'development') {
  accented();
}
```

To guarantee that Accented is not included in your application’s production JavaScript bundle,
consider importing it dynamically in development:

```
if (import.meta.env.MODE === 'development') {
  const { accented } = await import('accented');
  accented();
}
```

<a href="https://accented.dev">
  <img alt="Accented" src="https://accented.dev/images/logo.svg" width="100" height="100" />
</a>

# Accented

A frontend library for continuous accessibility testing and issue highlighting.

## What is Accented?

Accented is a visual library built on [axe-core](https://github.com/dequelabs/axe-core) that helps you catch issues in real time.

It displays interactive highlights for every accessibility issue that axe-core detects.

Here’s a side-by-side comparison — without Accented vs. with it enabled:

![Two screenshots of the same web application side by side. On the left, the regular state of the application. On the right, the same state but with bright outlines and buttons added to some page elements.](https://accented.dev/images/side-by-side.png)

[Try it out at the Playground (StackBlitz).](https://stackblitz.com/fork/github/pomerantsev/accented/tree/main/packages/playground?file=src%2Fmain.tsx&title=Accented%20playground%20(React%20%2B%20TypeScript))

Accented works well alongside other common accessibility tools:

- **It can catch more problems than source code linters alone.**
  The popular [`eslint-plugin-jsx-a11y`](https://www.npmjs.com/package/eslint-plugin-jsx-a11y)
  or the [Biome a11y linter](https://biomejs.dev/linter/javascript/rules/#a11y) are great,
  and they validate the whole codebase at once,
  but some issues can only be detected in the rendered page.
  For example, the linter cannot find issues with color contrast or heading order.
  Besides, Accented is not tied to JSX.
- **It runs as part of your project code — no browser extension or editor setup required.**
  You’d get a similar audit from [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview)
  or [axe DevTools](https://www.deque.com/axe/devtools/),
  but with Accented, there’s nothing extra to install, and the results are always up to date.
- **No need to write extra code, unlike when adding accessibility checks to a test suite.**
  You can test for accessibility issues in your test suite,
  for example using [`@axe-core/playwright`](https://www.npmjs.com/package/@axe-core/playwright).
  That means writing test cases for every state of your app you want to check.
  Accented, by contrast, automatically scans whatever’s currently visible in the browser.

When used in [console-only mode](https://accented.dev/getting-started#console-only-mode),
Accented behaves similarly to [@axe-core/react](https://www.npmjs.com/package/@axe-core/react) and can serve as a direct replacement.
Unlike @axe-core/react, Accented works with any framework — or none at all — making it suitable for any web project.

Learn more at [accented.dev](https://accented.dev).

## Installation and usage

Install:

```bash
npm install --save-dev accented
```

Then import and run during app initialization:

```js
if (process.env.NODE_ENV === 'development') {
  const { accented } = await import('accented');
  accented();
}
```

⚠️ Heads up: Accented is for development use only. Don’t expose it to end users.

See the docs for your bundler or framework for how to run code only in the development environment.

- [More detailed installation and usage guide](https://accented.dev/getting-started)
- [Full API](https://accented.dev/api)

## More info

- [Accessibility](https://accented.dev/about#accessibility) (how accessible is Accented itself?)
- [Performance](https://accented.dev/how-it-works#performance) (does it affect runtime performance?)
- [Browser support](https://accented.dev/about#browser-support) (will Accented work for me and my teammates?)
- [Versioning policy](https://accented.dev/about#versioning) (Accented follows [SemVer](https://semver.org/))
- [Changelog](https://github.com/pomerantsev/accented/blob/main/packages/accented/CHANGELOG.md)

## Contributing

Contributions are welcome!

- See [CONTRIBUTING.md](https://github.com/pomerantsev/accented/blob/main/CONTRIBUTING.md) for setup instructions and guidelines.
- Feel free to open an [issue](https://github.com/pomerantsev/accented/issues) or pull request if you spot a bug or have a feature idea.

Have feedback or ideas? Reach out to Pavel at [hello@pavelpomerantsev.com](mailto:hello@pavelpomerantsev.com).

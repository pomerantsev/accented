<a href="https://www.accented.dev">
  <img alt="Accented" src="https://www.accented.dev/images/logo.svg" width="100" height="100" />
</a>

# Accented

A frontend library for continuous accessibility testing and issue highlighting.

## What is Accented?

Accented is a visual library based on [axe-core](https://github.com/dequelabs/axe-core) that helps identify issues as soon as they are introduced.

It adds interactive visual callouts for all accessibility issues that axe-core identifies.

Example — without Accented vs. with Accented:

![Two screenshots of the same web application side by side. On the left, the regular state of the application. On the right, the same state but with bright outlines and buttons added to some page elements.](https://www.accented.dev/images/side-by-side.png)

[Try it out at the Playground (StackBlitz).](https://stackblitz.com/edit/accented-playground-react-ts?file=src%2Fmain.tsx)

Accented can complement other tools commonly used for accessibility testing:

- **It can find more issues than source code linting.** The popular [`eslint-plugin-jsx-a11y`](https://www.npmjs.com/package/eslint-plugin-jsx-a11y) is great, and linters validate the whole codebase, but some issues can only be detected on the rendered page. For example, the linter cannot find issues with color contrast or heading order. Besides, Accented is not framework-specific.
- **It’s embedded into the project code, with no setup required in the browser or code editor.** You’d get a similar audit from [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview) or [axe DevTools](https://www.deque.com/axe/devtools/), but with Accented, you don’t need a browser extension, and the results are always up to date.
- **You don’t need to write any extra code, unlike with adding accessibility tests to a test suite.** You can test for accessibility issues in your test suite, for example using [`@axe-core/playwright`](https://www.npmjs.com/package/@axe-core/playwright). For that, however, you need to write a test case for every state of the application that you want to test. Accented instead automatically tests anything that’s currently on the page in your browser.

Learn more about Accented at [accented.dev](https://www.accented.dev).

## Installation and usage

Install:

```bash
npm install --save-dev accented
```

Import and run at any moment during your app’s initialization:

```js
if (isDevelopment) {
  const { accented } = await import("accented");
  accented();
}
```

⚠️ **Heads up!**
Don’t expose Accented to your users.
It’s for development use only.

See the docs for your bundler or framework for how to run code only in the development environment.

- [More detailed installation and usage guide](https://www.accented.dev/getting-started)
- [Full API](https://www.accented.dev/api)

## More info

- [Accessibility](https://www.accented.dev/about#accessibility) (how accessible is Accented itself?)
- [Performance](https://www.accented.dev/how-it-works#performance) (does Accented affect runtime performance of my app?)
- [Browser support](https://www.accented.dev/about#browser-support) (will Accented work for me and my teammates?)
- [Versioning policy](https://www.accented.dev/about#versioning) (Accented follows [SemVer](https://semver.org/))
- [Changelog](https://github.com/pomerantsev/accented/blob/main/packages/accented/CHANGELOG.md)

## Contributing

Contributions are welcome!

- See [CONTRIBUTING.md](https://github.com/pomerantsev/accented/blob/main/CONTRIBUTING.md) for setup instructions and guidelines.
- Open an [issue](https://github.com/pomerantsev/accented/issues) or pull request if you spot a bug or want to propose a new feature.
- See [Milestones](https://github.com/pomerantsev/accented/milestones) to learn about our plans for Accented.

Have feedback or ideas? Contact Pavel at [hello@pavelpomerantsev.com](mailto:hello@pavelpomerantsev.com).

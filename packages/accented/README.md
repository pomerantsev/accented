# Accented

Continuous accessibility testing and issue highlighting for web development.

## What is Accented?

Accented is a visual library based on [axe-core](https://github.com/dequelabs/axe-core) that helps identify issues as soon as they are introduced.

TODO: screenshot: without Accented / with Accented.

[Try it out on StackBlitz.](https://stackblitz.com/edit/vitejs-vite-sy4bom3s?file=src%2Fmain.tsx)

Accented is different from most of the existing approaches to accessibility testing,
and it can complement other tools:

- **It can find more issues than source code linting.** The popular [`eslint-plugin-jsx-a11y`](https://www.npmjs.com/package/eslint-plugin-jsx-a11y) is great, but some types of issues can only be found on the rendered page. For example, the linter cannot find issues with color contrast or heading order.
- **It’s embedded into the project code, with no setup required in the browser or code editor.** You get a similar accessibility audit using [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview) or [axe DevTools](https://www.deque.com/axe/devtools/), but with Accented, you don’t need a browser extension, the results are always up-to-date, and all team members are guaranteed to see the same issues.
- **You don’t need to write any extra code, unlike with adding accessibility tests to a test suite.** You can test for accessibility issues in your test suite, for example using [`@axe-core/playwright`](https://www.npmjs.com/package/@axe-core/playwright). For that, however, you need to write a test case for every state of the application that you want to test. Accented instead automatically tests anything that’s currently on the page in your browser.

Learn more about Accented at [accented.dev](https://www.accented.dev).

## Getting started

Install:

```bash
npm install --save-dev accented
```

Import and run:

```js
if (isDevelopment) {
  const { accented } = await import("accented");
  accented();
}
```

⚠️ **Heads up!**
Don’t use Accented in production.

See the docs for your bundler or framework for how to run code only in the development environment.

See more examples at https://www.accented.dev/docs/getting-started/

## Contributing

Contributions are welcome!
See [CONTRIBUTING.md](https://github.com/pomerantsev/accented/blob/main/CONTRIBUTING.md) for setup instructions and guidelines.

If you spot a bug or want to propose a new feature, feel free to open an [issue](https://github.com/pomerantsev/accented/issues) or pull request.

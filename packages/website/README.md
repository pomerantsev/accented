# Accented docs website (accented.dev)

## Development

- Setup: `npm install -g pnpm && pnpm install`
- Run from root folder: `pnpm website:dev`

## Framework

Built with [Astro](https://astro.build/).

No frameworks on the frontend, just HTML + CSS + a little bit of vanilla JS where needed.

## Hosting

The website is hosted on Netlify: https://app.netlify.com/projects/accented/overview.

Created with Netlify CLI (see [Deploying on Netlify via GitHub Actions](https://www.raulmelo.me/en/blog/deploying-netlify-github-actions-guide)):

- `npm install netlify-cli -g`
- `netlify login`
- `netlify sites:create`

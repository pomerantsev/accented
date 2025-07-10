export const theme = 'github-dark-high-contrast';

type Bundler = {
  name: string;
  value: string;
  condition: string;
  checked?: boolean;
};
type Import = {
  name: string;
  value: string;
  checked?: boolean;
};
type Source = {
  name: string;
  value: string;
  module: string;
  checked?: boolean;
};
type Options = {
  bundlers: Array<Bundler>;
  imports: Array<Import>;
  sources: Array<Source>;
};

export const options: Options = {
  bundlers: [
    {
      name: 'Vite / Astro',
      value: 'vite',
      condition: "import.meta.env.MODE === 'development'",
      checked: true,
    },
    {
      name: 'Next.js / React Router / Gatsby',
      value: 'next',
      condition: "process.env.NODE_ENV === 'development'",
    },
    {
      name: 'Nuxt',
      value: 'nuxt',
      condition: 'process.dev',
    },
  ],
  imports: [
    {
      name: 'Dynamic (async / await)',
      value: 'dynamicAsyncAwait',
      checked: true,
    },
    {
      name: 'Dynamic (promises)',
      value: 'dynamicPromises',
    },
    {
      name: 'Static',
      value: 'static',
    },
  ],
  sources: [
    {
      name: 'NPM (with bundler)',
      value: 'npm',
      module: 'accented',
      checked: true,
    },
    {
      name: 'CDN (no bundler required)',
      module: 'https://esm.sh/accented',
      value: 'cdn',
    },
  ],
};

export function getCodeSnippet(
  bundler: Bundler | undefined,
  importType: Import['value'] | undefined,
  source: Source | undefined,
) {
  if (!bundler || !importType || !source) {
    return '';
  }

  if (importType === 'dynamicAsyncAwait') {
    return `if (${bundler.condition}) {
  const { accented } = await import('${source.module}');
  accented();
}`;
  }

  if (importType === 'dynamicPromises') {
    return `if (${bundler.condition}) {
  import('${source.module}').then(({ accented }) => {
    accented();
  });
}`;
  }

  if (importType === 'static') {
    return `import { accented } from '${source.module}';
if (${bundler.condition}) {
  accented();
}`;
  }

  throw new Error(`Unknown import type: ${importType}`);
}

import accented from'accented';
import type { DisableAccented, AccentedOptions } from 'accented';
import type { RuleObject } from 'axe-core';

const searchParams = new URLSearchParams(location.search);

let stopAccented: DisableAccented | null = null;

function toggleAccented(opts: AccentedOptions = {}) {
  if (stopAccented) {
    stopAccented();
    stopAccented = null;
  } else {
    stopAccented = accented(opts);
  }
}

let options: AccentedOptions = {
  axeOptions: {}
};

if (searchParams.has('options-invalid')) {
  options = 'foo' as any;
}

if (searchParams.has('callback')) {
  options.output = { console: false };
  options.callback = ({elementsWithIssues}) => {
    console.log('Elements from callback:', elementsWithIssues);
  };
}

if (searchParams.has('callback-invalid')) {
  options.callback = searchParams.get('output-invalid') as any;
}

if (searchParams.has('duration') && !searchParams.has('callback')) {
  options.callback = ({scanDuration}) => {
    console.log('Scan duration:', scanDuration);
  };
}

if (searchParams.has('throttle-wait')) {
  options.throttle = {
    wait: parseInt(searchParams.get('throttle-wait')!, 10) ?? 1000,
    leading: !searchParams.has('no-leading')
  };
} else if (searchParams.has('throttle-invalid')) {
  options.throttle = searchParams.get('throttle-invalid') as any;
} else if (searchParams.has('throttle-wait-invalid')) {
  options.throttle = {
    wait: searchParams.get('throttle-wait-invalid') as any
  };
}

if (searchParams.has('no-leading') && !searchParams.has('throttle-wait')) {
  options.throttle = {
    leading: false
  };
}

if (searchParams.has('no-console')) {
  options.output = { console: false };
}

if (searchParams.has('output-invalid')) {
  options.output = searchParams.get('output-invalid') as any;
}

if (searchParams.has('name')) {
  options.name = searchParams.get('name')!;
}

if (searchParams.has('run-only')) {
  options.axeOptions = {
    ...options.axeOptions,
    // Pass an array as `runOnly` (one of the available options in axe-core).
    runOnly: searchParams.get('run-only')!.split(',')
  }
}
if (searchParams.has('disable-rules')) {
  const rules = searchParams.get('disable-rules')!.split(',').reduce((acc: RuleObject, rule) => ({
    ...acc,
    [rule]: { enabled: false }
  }), {});
  options.axeOptions = {
    ...options.axeOptions,
    rules
  }
}
if (searchParams.has('axe-options-reporter')) {
  options.axeOptions = {
    ...options.axeOptions,
    // @ts-expect-error `reporter` is not defined on AxeOptions.
    reporter: searchParams.get('axe-options-reporter')
  };
}
if (searchParams.has('axe-options-invalid')) {
  options.axeOptions = searchParams.get('axe-options-invalid') as any;
}

if (searchParams.has('axe-context-selector')) {
  options.axeContext = searchParams.get('axe-context-selector')!;
}

if (!searchParams.has('disable')) {
  toggleAccented(options);

  if (searchParams.has('quick-toggle')) {
    queueMicrotask(() => {
      toggleAccented(options);
      queueMicrotask(() => {
        toggleAccented(options);
      });
    });
  }
}

if (searchParams.has('small-caps')) {
  const stylesheet = new CSSStyleSheet();
  stylesheet.replaceSync(`
    body * {
      font-variant-caps: small-caps !important;
    }
  `);
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, stylesheet];
}

export default () => { toggleAccented(options); };

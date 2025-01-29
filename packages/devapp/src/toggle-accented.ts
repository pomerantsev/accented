import accented from'accented';
import type { DisableAccented, AccentedOptions } from 'accented';

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

let options: AccentedOptions = {};

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

export default () => { toggleAccented(options); };

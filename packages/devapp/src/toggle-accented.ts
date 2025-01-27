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

if (searchParams.has('callback')) {
  options.output = { console: false };
  options.callback = ({elementsWithIssues}) => {
    console.log('Elements from callback:', elementsWithIssues);
  };
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
}

if (searchParams.has('no-leading') && !searchParams.has('throttle-wait')) {
  options.throttle = {
    leading: false
  };
}

if (searchParams.has('no-console')) {
  options.output = { console: false };
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

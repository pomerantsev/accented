import accented from'accented';
import type { DisableAccented } from 'accented';

let stopAccented: DisableAccented | null = null;
function toggleAccented() {
  if (stopAccented) {
    stopAccented();
    stopAccented = null;
  } else {
    stopAccented = accented({callback: ({scanDuration}) => {
      console.log('Scan duration:', scanDuration);
    }});
  }
}

if (location.search !== '?disable') {
  toggleAccented();
}

document.getElementById('toggleAccented')?.addEventListener('click', () => {
  toggleAccented();
});

document.getElementById('add-one')?.addEventListener('click', () => {
  const container = document.getElementById('many-elements');
  const button = document.createElement('button');
  button.className = 'test-button';
  container?.appendChild(button);
});

document.getElementById('add-many-with-issues')?.addEventListener('click', () => {
  const container = document.getElementById('many-elements');
  for (let i = 0; i < 1000; i++) {
    const button = document.createElement('button');
    button.className = 'test-button';
    container?.appendChild(button);
  }
});

document.getElementById('add-many-no-issues')?.addEventListener('click', () => {
  const container = document.getElementById('many-elements');
  for (let i = 0; i < 1000; i++) {
    const button = document.createElement('button');
    button.className = 'test-button';
    button.textContent = 'Click me';
    container?.appendChild(button);
  }
});

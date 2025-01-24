import toggleAccented from './toggle-accented';

document.getElementById('toggleAccented')?.addEventListener('click', () => {
  toggleAccented();
});

document.getElementById('toggle-text-direction')?.addEventListener('click', () => {
  document.documentElement.dir = document.documentElement.dir === 'ltr' ? 'rtl' : 'ltr';
});

let buttonCount = 0;

document.getElementById('add-one')?.addEventListener('click', () => {
  const container = document.getElementById('many-elements');
  const button = document.createElement('button');
  button.className = 'test-button';
  buttonCount++;
  button.textContent = `Button ${buttonCount}`;
  button.setAttribute('aria-hidden', 'both');
  container?.appendChild(button);
});

document.getElementById('add-issue')?.addEventListener('click', () => {
  document.getElementById('button-with-single-issue')?.setAttribute('aria-checked', 'true');
});

document.getElementById('add-text')?.addEventListener('click', () => {
  const button = document.getElementById('button-with-single-issue');
  if (button) {
    button.textContent = 'Click me';
  }
});

document.getElementById('remove-button')?.addEventListener('click', () => {
  document.getElementById('button-with-single-issue')?.remove();
});

setTimeout(() => {
  const buttonWithManyIssues = document.getElementById('over-2-issues');
  const status = document.getElementById('issues-updated-status');
  if (buttonWithManyIssues && status) {
    buttonWithManyIssues.role = '';
    status.hidden = false;
  }
}, 1000);

document.getElementById('add-two')?.addEventListener('click', () => {
  const container = document.getElementById('many-elements');
  for (let i = 0; i < 2; i++) {
    const button = document.createElement('button');
    button.className = 'test-button';
    buttonCount++;
    button.textContent = `Button ${buttonCount}`;
    button.setAttribute('aria-hidden', 'both');
    container?.appendChild(button);
  }
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

document.getElementById('open-dialog')?.addEventListener('click', () => {
  (document.getElementById('dialog') as HTMLDialogElement)?.showModal();
});

document.getElementById('enter-fullscreen')?.addEventListener('click', () => {
  document.getElementById('fullscreen-container')?.requestFullscreen();
});

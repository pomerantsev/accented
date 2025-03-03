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

document.getElementById('button-with-single-issue')?.addEventListener('click', () => {
  console.log('Button clicked');
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

document.getElementById('open-modal-dialog')?.addEventListener('click', () => {
  (document.getElementById('modal-dialog') as HTMLDialogElement)?.showModal();
});

document.getElementById('open-non-modal-dialog')?.addEventListener('click', () => {
  (document.getElementById('non-modal-dialog') as HTMLDialogElement)?.show();
});

document.getElementById('enter-fullscreen')?.addEventListener('click', () => {
  document.getElementById('fullscreen-container')?.requestFullscreen();
});

document.getElementById('change-button-transform')?.addEventListener('click', () => {
  const button = document.getElementById('transformed-button');
  if (button) {
    button.style.transform = 'translateX(200%) scale(2)';
  }
});

document.getElementById('change-section-transform')?.addEventListener('click', () => {
  const section = document.getElementById('transformed-section');
  if (section) {
    section.style.transform = 'translateX(100px) scale(1.2)';
  }
});

document.getElementById('move-element-from-iframe')?.addEventListener('click', () => {
  const iframe = document.getElementById('iframe-test') as HTMLIFrameElement;
  const iframedSection = iframe?.contentDocument?.querySelector('section');
  if (iframe && iframedSection) {
    iframe.insertAdjacentElement('afterend', iframedSection);
  }
});

// This is needed to test that the Escape press doesn't propagate to the document from the dialog
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    console.log('Escape pressed');
  }
});

import { toggleAccented } from './toggle-accented';

const searchParams = new URLSearchParams(location.search);

if (searchParams.has('base-font-size')) {
  document.documentElement.style.fontSize = searchParams.get('base-font-size')!;
}

document.getElementById('toggleAccented')?.addEventListener('click', () => {
  toggleAccented();
});

document.getElementById('toggle-text-direction')?.addEventListener('click', () => {
  document.documentElement.dir = document.documentElement.dir === 'ltr' ? 'rtl' : 'ltr';
});

let buttonCount = 0;

document.getElementById('add-one')?.addEventListener('click', () => {
  const container = document.getElementById('few-elements');
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

if (searchParams.has('remove-some-issues-on-timeout')) {
  setTimeout(() => {
    const buttonWithManyIssues = document.getElementById('over-2-issues');
    const status = document.getElementById('issues-updated-status');
    if (buttonWithManyIssues && status) {
      buttonWithManyIssues.role = '';
      status.hidden = false;
    }
  }, 1000);
}

if (searchParams.has('remove-all-issues-on-timeout')) {
  setTimeout(() => {
    const buttonWithManyIssues = document.getElementById('over-2-issues');
    const status = document.getElementById('issues-updated-status');
    if (buttonWithManyIssues && status) {
      buttonWithManyIssues.role = '';
      status.hidden = false;
      buttonWithManyIssues.removeAttribute('aria-checked');
      buttonWithManyIssues.innerText = 'Click me';
    }
  }, 1000);
}

if (searchParams.has('remove-element-on-timeout')) {
  setTimeout(() => {
    const buttonWithManyIssues = document.getElementById('over-2-issues');
    const status = document.getElementById('issues-updated-status');
    if (buttonWithManyIssues && status) {
      buttonWithManyIssues.remove();
      status.hidden = false;
    }
  }, 1000);
}

document.getElementById('add-two')?.addEventListener('click', () => {
  const container = document.getElementById('few-elements');
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

document.getElementById('issue-in-a-link-link')?.addEventListener('click', () => {
  console.log('Link clicked');
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

const correctlyStructuredList = document.getElementById('correctly-structured-list');
const addDivToListButton = document.getElementById('add-div-to-list');
const increaseListItemContrastButton = document.getElementById('increase-list-item-contrast');

addDivToListButton?.addEventListener('click', () => {
  const div = document.createElement('div');
  div.textContent = 'I’m a div';
  correctlyStructuredList?.appendChild(div);
});

increaseListItemContrastButton?.addEventListener('click', () => {
  const lowContrastListItem = document.getElementById('low-contrast-list-item');
  if (lowContrastListItem) {
    lowContrastListItem.style.color = 'black';
  }
});

const moveBetweenShadowRootsButton = document.getElementById('move-button-between-shadow-roots');
moveBetweenShadowRootsButton?.addEventListener('click', () => {
  const buttonToMove = document
    .getElementById('shadow-dom-container-1')
    ?.shadowRoot?.querySelector('.test-button');
  const newContainer = document
    .getElementById('shadow-dom-container-2')
    ?.shadowRoot?.getElementById('container');
  if (buttonToMove && newContainer) {
    newContainer.insertAdjacentElement('beforeend', buttonToMove);
  }
});

// This is needed to test that the Escape press doesn't propagate to the document from the dialog
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    console.log('Escape pressed');
  }
});

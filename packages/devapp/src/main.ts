import toggleAccented from './toggle-accented';

document.getElementById('toggleAccented')?.addEventListener('click', () => {
  toggleAccented();
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

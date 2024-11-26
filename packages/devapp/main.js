import('accented').then(({default: accented}) => { accented(); });

document.getElementById('addOneMoreCSS').addEventListener('click', (event) => {
  const button = document.createElement('button');
  button.style.width = '5rem';
  button.style.height = '5rem';
  // TODO: I want to try transitioning a property like "visibility" :)
  button.style.transition = '2s linear transform';
  button.style.transform = 'translateX(100%)';

  const div = document.createElement('div');
  div.appendChild(button);

  event.target.insertAdjacentElement('afterend', div);
  requestIdleCallback(() => {
    button.style.transform = 'translateX(0)';
  });
});

document.getElementById('addOneMoreJS').addEventListener('click', (event) => {
  const button = document.createElement('button');
  button.style.width = '5rem';
  button.style.height = '5rem';
  button.style.transform = 'translateX(100%)';

  const div = document.createElement('div');
  div.appendChild(button);

  event.target.insertAdjacentElement('afterend', div);

  const DURATION = 1000;
  const beginning = Date.now();

  function drawFrame() {
    const time = Date.now() - beginning;
    const completionRatio = time < DURATION ? time / DURATION : 1;
    button.style.transform = `translateX(${(1 - completionRatio) * 100}%)`;
    if (completionRatio < 1) {
      requestAnimationFrame(drawFrame);
    }
  }

  requestAnimationFrame(drawFrame);
});

document.getElementById('addManyMore').addEventListener('click', () => {
  const section = document.createElement('section');

  for (let i = 0; i < 1000; i++) {
    const div = document.createElement('div');
    div.style.marginBlockStart = '1rem';
    const button = document.createElement('button');
    button.style.width = '5rem';
    button.style.height = '5rem';
    div.appendChild(button);
    section.appendChild(div);
  }

  document.body.appendChild(section);
});
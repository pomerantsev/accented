import type { Issue } from '../types';
import type { Signal } from '@preact/signals-core';
import { effect } from '@preact/signals-core';

const template = document.createElement('template');
template.innerHTML = `
  <button id="trigger">⚠</button>
  <dialog>
    <h2>Issues</h2>
    <ul id="issues"></ul>
  </dialog>
`;

export const getStylesheetContent = (name: string) => `
  #trigger {
    font-size: 1rem;
    inline-size: min(32px, 2rem);
    block-size: min(32px, 2rem);
    border: none;
    background-color: var(--${name}-primary-color);
    color: var(--${name}-secondary-color);
  }
`;

export default class AccentedContainer extends HTMLElement {
  static stylesheet = new CSSStyleSheet();

  #abortController: AbortController | undefined;

  #disposeOfEffect: (() => void) | undefined;

  issues: Signal<Array<Issue>> | undefined;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    const content = template.content.cloneNode(true);
    if (this.shadowRoot) {
      this.shadowRoot.adoptedStyleSheets.push(AccentedContainer.stylesheet);
      this.shadowRoot.append(content);
    }
  }

  connectedCallback() {
    if (this.shadowRoot) {
      const { shadowRoot } = this;
      const trigger = shadowRoot.getElementById('trigger');
      const dialog = shadowRoot.querySelector('dialog');
      this.#abortController = new AbortController();
      trigger?.addEventListener('click', () => {
        dialog?.showModal();
      }, { signal: this.#abortController.signal });

      this.#disposeOfEffect = effect(() => {
        if (this.issues) {
          const issues = this.issues.value;
          const issuesList = shadowRoot.getElementById('issues');
          if (issuesList) {
            issuesList.innerHTML = '';
            for (const issue of issues) {
              const li = document.createElement('li');
              li.textContent = issue.title;
              issuesList.appendChild(li);
            }
          }
        }
      });
    }
  }

  disconnectedCallback() {
    if (this.#abortController) {
      this.#abortController.abort();
    }
    if (this.#disposeOfEffect) {
      this.#disposeOfEffect();
    }
  }
};

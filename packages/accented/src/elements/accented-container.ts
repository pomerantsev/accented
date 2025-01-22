import type { Issue } from '../types';
import type { Signal } from '@preact/signals-core';
import { effect } from '@preact/signals-core';

export const getStylesheetContent = (name: string) => `
  :host {
    inset-inline-end: anchor(end);
    inset-block-end: anchor(end);

    /* Popover-specific stuff */
    border: none;
    padding: 0;
    margin-inline-end: 0;
    margin-block-end: 0;
  }

  #trigger {
    font-size: 1rem;
    inline-size: max(32px, 2rem);
    block-size: max(32px, 2rem);
    border: none;
    background-color: var(--${name}-primary-color);
    color: var(--${name}-secondary-color);

    outline-offset: -4px;
    outline-color: var(--${name}-secondary-color);

    &:focus-visible {
      outline-width: 2px;
      outline-style: solid;
    }

    &:hover:not(:focus-visible) {
      outline-width: 2px;
      outline-style: dashed;
    }
  }
`;

export interface AccentedContainer extends HTMLElement {
  issues: Signal<Array<Issue>> | undefined;
}

// We want Accented to not throw an error in Node, and use static imports,
// so we can't export `class extends HTMLElement` because HTMLElement is not available in Node.
export default () => {
  const containerTemplate = document.createElement('template');
  containerTemplate.innerHTML = `
    <button id="trigger">⚠</button>
    <dialog dir="ltr">
      <h2>Issues</h2>
      <ul id="issues"></ul>
    </dialog>
  `;

  const issueTemplate = document.createElement('template');
  issueTemplate.innerHTML = `
    <li>
      <a></a>
      <div></div>
    </li>
  `;

  const descriptionTemplate = document.createElement('template');
  descriptionTemplate.innerHTML = `
    <span></span>
    <ul></ul>
  `;

  return class AccentedContainerLocal extends HTMLElement implements AccentedContainer {
    static stylesheet = new CSSStyleSheet();

    #abortController: AbortController | undefined;

    #disposeOfEffect: (() => void) | undefined;

    issues: Signal<Array<Issue>> | undefined;

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      const content = containerTemplate.content.cloneNode(true);
      if (this.shadowRoot) {
        this.shadowRoot.adoptedStyleSheets.push(AccentedContainerLocal.stylesheet);
        this.shadowRoot.append(content);
      }
    }

    connectedCallback() {
      this.showPopover();
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
                const issueContent = issueTemplate.content.cloneNode(true) as Element;
                const a = issueContent.querySelector('a');
                const div = issueContent.querySelector('div');
                if (a && div) {
                  a.textContent = issue.title;
                  a.href = issue.url;
                  const descriptionItems = issue.description.split(/\n\s*/);
                  const descriptionContent = descriptionTemplate.content.cloneNode(true) as Element;
                  const descriptionTitle = descriptionContent.querySelector('span');
                  const descriptionList = descriptionContent.querySelector('ul');
                  if (descriptionTitle && descriptionList && descriptionItems.length > 1) {
                    descriptionTitle.textContent = descriptionItems[0]!;
                    for (const descriptionItem of descriptionItems.slice(1)) {
                      const li = document.createElement('li');
                      li.textContent = descriptionItem;
                      descriptionList.appendChild(li);
                    }
                    div.appendChild(descriptionContent);
                  }
                }
                issuesList.appendChild(issueContent);
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
};

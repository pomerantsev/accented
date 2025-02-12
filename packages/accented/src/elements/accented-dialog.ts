import type { Issue } from '../types';
import type { Signal } from '@preact/signals-core';
import { effect } from '@preact/signals-core';
import getElementHtml from '../utils/get-element-html.js';

export interface AccentedDialog extends HTMLElement {
  issues: Signal<Array<Issue>> | undefined;
  element: Element | undefined;
  showModal: () => void;
}

// We want Accented to not throw an error in Node, and use static imports,
// so we can't export `class extends HTMLElement` because HTMLElement is not available in Node.
export default (name: string) => {
  const dialogTemplate = document.createElement('template');
  dialogTemplate.innerHTML = `
    <dialog dir="ltr" aria-labelledby="title">
      <button id="close" aria-label="Close">✕</button>
      <h2 id="title">Issues</h2>
      <code id="element-html"></code>
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

  const stylesheet = new CSSStyleSheet();
  stylesheet.replaceSync(`
    :host {
      all: initial;
    }
  `);

  return class extends HTMLElement implements AccentedDialog {
    #disposeOfEffect: (() => void) | undefined;

    #abortController: AbortController | undefined;

    issues: Signal<Array<Issue>> | undefined;

    element: Element | undefined;

    #elementMutationObserver: MutationObserver | undefined;

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      const content = dialogTemplate.content.cloneNode(true);
      if (this.shadowRoot) {
        this.shadowRoot.adoptedStyleSheets.push(stylesheet);
        this.shadowRoot.append(content);
      }
    }

    connectedCallback() {
      if (this.shadowRoot) {
        const { shadowRoot } = this;
        const dialog = shadowRoot.querySelector('dialog');
        const closeButton = shadowRoot.querySelector('#close');
        this.#abortController = new AbortController();
        closeButton?.addEventListener('click', (event) => {
          dialog?.close();
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

        const updateElementHtml = () => {
          if (this.element) {
            const elementHtmlContainer = shadowRoot.getElementById('element-html');
            if (elementHtmlContainer) {
              elementHtmlContainer.textContent = getElementHtml(this.element);
            }
          }
        };

        updateElementHtml();

        this.#elementMutationObserver = new MutationObserver(() => {
          updateElementHtml();
        });
        if (this.element) {
          // We're only outputting the element itself, not its subtree.
          // However, we're still listening for childList changes, because
          // we display an ellipsis if the element has innerHTML,
          // and we leave it empty if the element is empty.
          this.#elementMutationObserver.observe(this.element, {
            attributes: true,
            childList: true
          });
        }

      }
    }

    disconnectedCallback() {
      if (this.#disposeOfEffect) {
        this.#disposeOfEffect();
      }
      if (this.#abortController) {
        this.#abortController.abort();
      }
      if (this.#elementMutationObserver) {
        this.#elementMutationObserver.disconnect();
      }
    }

    showModal() {
      if (this.shadowRoot) {
        const dialog = this.shadowRoot.querySelector('dialog');
        if (dialog) {
          dialog.showModal();
        }
      }
    }
  };
};

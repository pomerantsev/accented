import type { Issue } from '../types';
import type { Signal } from '@preact/signals-core';
import { effect } from '@preact/signals-core';
import getElementHtml from '../utils/get-element-html.js';
import { accentedUrl } from '../constants.js';

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
    <dialog dir="ltr" lang="en" aria-labelledby="title">
      <div id="button-container">
        <button id="close" aria-label="Close">✕</button>
      </div>
      <h2 id="title">Accessibility issues</h2>
      <section id="element-html-container" aria-label="Element">
        <code id="element-html"></code>
      </section>
      <ul id="issues"></ul>
      <section id="footer">
        <p>
          Powered by
          <a href="${accentedUrl}" target="_blank" aria-description="Opens in new tab">Accented</a>
          and
          <a href="https://github.com/dequelabs/axe-core" target="_blank" aria-description="Opens in new tab">axe-core</a>.
        </p>
      </section>
    </dialog>
  `;

  const issueTemplate = document.createElement('template');
  issueTemplate.innerHTML = `
    <li>
      <a target="_blank" aria-description="Opens in new tab"></a>
      <div class="description"></div>
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
      all: initial !important;
    }

    a, button {
      &:hover, &:focus-visible {
        outline-width: 2px;
        outline-color: currentColor;
        outline-offset: 2px;
      }
      &:focus-visible {
        outline-style: solid;
      }
      &:hover:not(:focus-visible) {
        outline-style: dashed;
      }
    }

    :focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 2px;
    }

    dialog {
      box-sizing: border-box;
      overflow-wrap: break-word;
      font-family: system-ui;
      line-height: 1.5;
      background-color: var(--${name}-light-color);
      color: var(--${name}-dark-color);
      border: 2px solid var(--${name}-dark-color);
      padding: var(--${name}-space-l);
      margin: auto;
      inline-size: min(90ch, calc(100% - var(--${name}-space-s)* 2));
      max-block-size: calc(100% - var(--${name}-space-s) * 2);

      &, &::backdrop {
        transition-behavior: allow-discrete;
        transition-property: overlay, display, opacity;

        transition-duration: 0;
        @media (prefers-reduced-motion: no-preference) {
          transition-duration: 200ms;
        }

        opacity: 0;
      }

      &[open], &[open]::backdrop {
        opacity: 1;
        @starting-style {
          opacity: 0;
        }
      }
    }

    #button-container {
      text-align: end;
    }

    button {
      background-color: var(--${name}-light-color);
      color: var(--${name}-dark-color);
      border: 2px solid currentColor;
      padding-inline: var(--${name}-space-2xs);
      aspect-ratio: 1 / 1;
      font-size: var(--${name}-step-0);
    }

    h2 {
      font-size: var(--${name}-step-3);
      line-height: 1.2;
      margin-block-start: var(--${name}-space-s);
      margin-block-end: 0;
    }

    #element-html-container {
      padding: var(--${name}-space-xs);
      border: 2px solid currentColor;
      margin-block-start: var(--${name}-space-l);
    }

    code {
      font-family: Menlo, Consolas, Monaco, Liberation Mono, Lucida Console, monospace;
      font-size: var(--${name}-step--1);
    }

    #issues {
      font-size: var(--${name}-step-0);
      margin-block-start: var(--${name}-space-l);
      padding-inline: 0;
      list-style: none;

      & > li:not(:first-child) {
        margin-block-start: var(--${name}-space-m);
      }

      a {
        font-weight: bold;
      }
    }

    a[href] {
      color: currentColor;
    }

    a[href][target="_blank"]::after {
      content: " ↗";
    }

    .description {
      margin-block-start: var(--${name}-space-2xs);
      font-size: var(--${name}-step--1);
    }

    #footer {
      margin-block-start: var(--${name}-space-l);
      font-size: var(--${name}-step--1);

      p {
        margin: 0;
        text-align: end;
      }
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

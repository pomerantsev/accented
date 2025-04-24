import type { Issue } from '../types';
import type { Signal } from '@preact/signals-core';
import getElementHtml from '../utils/get-element-html.js';
import { accentedUrl } from '../constants.js';
import logAndRethrow from '../log-and-rethrow.js';

export interface AccentedDialog extends HTMLElement {
  issues: Signal<Array<Issue>> | undefined;
  element: Element | undefined;
  showModal: () => void;
  open: boolean;
}

// We want Accented to not throw an error in Node, and use static imports,
// so we can't export `class extends HTMLElement` because HTMLElement is not available in Node.
export default () => {
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
      <div class="impact"></div>
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

      /* OKLCH stuff: https://oklch.com/ */
      --light-color: oklch(0.98 0 0);
      --dark-color: oklch(0.22 0 0);

      --background-color: light-dark(var(--light-color), var(--dark-color));
      --text-color: light-dark(var(--dark-color), var(--light-color));

      --impact-lightness: 0.80;
      --focus-lightness: 0.45;
      @media (prefers-color-scheme: dark) {
        --impact-lightness: 0.45;
        --focus-lightness: 0.80;
      }

      --blue-hue: 230;
      --gold-hue: 90;
      --red-hue: 0;

      /* Contrasts with background. */
      --focus-color: oklch(var(--focus-lightness) 0.25 var(--blue-hue));

      --impact-chroma: 0.16;

      --impact-moderate-hue: var(--blue-hue);
      --impact-serious-hue: var(--gold-hue);
      --impact-critical-hue: var(--red-hue);

      --impact-minor-color: oklch(var(--impact-lightness) 0 0);
      --impact-moderate-color: oklch(var(--impact-lightness) var(--impact-chroma) var(--impact-moderate-hue));
      --impact-serious-color: oklch(var(--impact-lightness) var(--impact-chroma) var(--impact-serious-hue));
      --impact-critical-color: oklch(var(--impact-lightness) var(--impact-chroma) var(--impact-critical-hue));

      --base-size: max(1rem, 16px);

      /* Spacing and typography custom props, inspired by https://utopia.fyi (simplified). */

      /* @link https://utopia.fyi/type/calculator?c=320,16,1.2,1240,16,1.2,5,2,&s=0.75|0.5|0.25,1.5|2|3|4|6,s-l&g=s,l,xl,12 */
      --ratio: 1.2;
      --step-0: var(--base-size);
      --step-1: calc(var(--step-0) * var(--ratio));
      --step-2: calc(var(--step-1) * var(--ratio));
      --step-3: calc(var(--step-2) * var(--ratio));
      --step-4: calc(var(--step-3) * var(--ratio));
      --step--1: calc(var(--step-0) / var(--ratio));

      /* @link https://utopia.fyi/space/calculator?c=320,16,1.2,1240,16,1.2,5,2,&s=0.75|0.5|0.25,1.5|2|3|4|6,s-l&g=s,l,xl,12 */
      --space-3xs: calc(0.25 * var(--base-size));
      --space-2xs: calc(0.5 * var(--base-size));
      --space-xs: calc(0.75 * var(--base-size));
      --space-s: var(--base-size);
      --space-m: calc(1.5 * var(--base-size));
      --space-l: calc(2 * var(--base-size));
      --space-xl: calc(3 * var(--base-size));
      --space-2xl: calc(4 * var(--base-size));
      --space-3xl: calc(6 * var(--base-size));
    }

    a[href], button {
      outline-offset: 2px;
      outline-color: var(--focus-color);
      outline-width: 2px;
      outline-style: none;

      &:focus-visible {
        outline-style: solid;
      }

      &:hover:not(:focus-visible) {
        outline-style: dashed;
      }
    }

    a[href] {
      color: currentColor;
    }

    a[href][target="_blank"]::after {
      content: " ↗";
    }

    dialog {
      box-sizing: border-box;
      overflow-wrap: break-word;
      font-family: system-ui;
      line-height: 1.5;
      text-wrap: pretty;
      background-color: var(--background-color);
      color: var(--text-color);
      border: 2px solid currentColor;
      padding: var(--space-l);
      inline-size: min(90ch, calc(100% - var(--space-s)* 2));
      max-block-size: calc(100% - var(--space-s) * 2);

      color-scheme: light dark;
    }

    #button-container {
      text-align: end;
    }

    #close {
      background-color: var(--background-color);
      color: var(--text-color);
      border: 2px solid currentColor;
      padding-inline: var(--space-2xs);
      aspect-ratio: 1 / 1;
      font-size: var(--step-0);
    }

    h2 {
      font-size: var(--step-4);
      line-height: 1.2;
      margin-block-start: var(--space-s);
      margin-block-end: 0;
    }

    #element-html-container {
      padding: var(--space-xs);
      border: 2px solid currentColor;
      margin-block-start: var(--space-l);
    }

    code {
      /* https://systemfontstack.com/ */
      font-family: Menlo, Consolas, Monaco, Liberation Mono, Lucida Console, monospace;
      font-size: var(--step--1);
    }

    #issues {
      font-size: var(--step-1);
      margin-block-start: var(--space-l);
      padding-inline: 0;
      list-style: none;

      & > li:not(:first-child) {
        margin-block-start: var(--space-m);
      }

      a {
        font-weight: 500;
      }
    }

    .impact {
      margin-block-start: var(--space-2xs);
      font-size: var(--step--1);

      inline-size: fit-content;
      padding-inline: var(--space-3xs);

      &[data-impact="minor"] {
        background-color: var(--impact-minor-color);
      }
      &[data-impact="moderate"] {
        background-color: var(--impact-moderate-color);
      }
      &[data-impact="serious"] {
        background-color: var(--impact-serious-color);
      }
      &[data-impact="critical"] {
        background-color: var(--impact-critical-color);
      }
    }

    .description {
      margin-block-start: var(--space-2xs);
      font-size: var(--step--1);

      li {
        list-style-type: disc;
      }
    }

    #footer {
      margin-block-start: var(--space-l);
      font-size: var(--step--1);

      p {
        margin: 0;
        text-align: end;
      }
    }
  `);

  return class extends HTMLElement implements AccentedDialog {
    #abortController: AbortController | undefined;

    issues: Signal<Array<Issue>> | undefined;

    element: Element | undefined;

    open: boolean = false;

    constructor() {
      try {
        super();
        this.attachShadow({ mode: 'open' });
        const content = dialogTemplate.content.cloneNode(true);
        if (this.shadowRoot) {
          this.shadowRoot.adoptedStyleSheets.push(stylesheet);
          this.shadowRoot.append(content);
        }
      } catch (error) {
        logAndRethrow(error);
      }
    }

    connectedCallback() {
      try {
        if (this.shadowRoot) {
          const { shadowRoot } = this;
          const dialog = shadowRoot.querySelector('dialog');
          const closeButton = shadowRoot.querySelector('#close');
          this.#abortController = new AbortController();
          closeButton?.addEventListener('click', () => {
            try {
              dialog?.close();
            } catch (error) {
              logAndRethrow(error);
            }
          }, { signal: this.#abortController.signal });

          dialog?.addEventListener('click', (event) => {
            try {
              this.#onDialogClick(event);
            } catch (error) {
              logAndRethrow(error);
            }
          }, { signal: this.#abortController.signal });

          dialog?.addEventListener('keydown', (event) => {
            try {
              if (event.key === 'Escape') {
                event.stopPropagation();
              }
            } catch (error) {
              logAndRethrow(error);
            }
          }, { signal: this.#abortController.signal });

          if (this.issues) {
            const issues = this.issues.value;
            const issuesList = shadowRoot.getElementById('issues');
            if (issuesList) {
              issuesList.innerHTML = '';
              for (const issue of issues) {
                const issueContent = issueTemplate.content.cloneNode(true) as Element;
                const title = issueContent.querySelector('a');
                const impact = issueContent.querySelector('.impact');
                const description = issueContent.querySelector('.description');
                if (title && impact && description) {
                  title.textContent = issue.title + ' (' + issue.id + ')';
                  title.href = issue.url;

                  impact.textContent = 'User impact: ' + issue.impact;
                  impact.setAttribute('data-impact', String(issue.impact));

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
                    description.appendChild(descriptionContent);
                  }
                }
                issuesList.appendChild(issueContent);
              }
            }
          }

          if (this.element) {
            const elementHtmlContainer = shadowRoot.getElementById('element-html');
            if (elementHtmlContainer) {
              elementHtmlContainer.textContent = getElementHtml(this.element);
            }
          }

          dialog?.addEventListener('close', () => {
            try {
              this.open = false;
              this.dispatchEvent(new Event('close'));
            } catch (error) {
              logAndRethrow(error);
            }
          }, { signal: this.#abortController.signal });
        }
      } catch (error) {
        logAndRethrow(error);
      }
    }

    disconnectedCallback() {
      try {
        if (this.#abortController) {
          this.#abortController.abort();
        }
      } catch (error) {
        logAndRethrow(error);
      }
    }

    showModal() {
      if (this.shadowRoot) {
        const dialog = this.shadowRoot.querySelector('dialog');
        if (dialog) {
          dialog.showModal();
          this.open = true;
        }
      }
    }

    #onDialogClick(event: MouseEvent) {
      const dialog = event.currentTarget as HTMLDialogElement;
      if (!dialog || typeof dialog.getBoundingClientRect !== 'function' || typeof dialog.close !== 'function') {
        return;
      }
      const rect = dialog.getBoundingClientRect();
      const isInsideDialog =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      if (!isInsideDialog) {
        dialog.close();
      }
    }
  };
};

import type { AccentedDialog } from './accented-dialog';
import type { Position } from '../types';
import { effect } from '@preact/signals-core';
import type { Signal } from '@preact/signals-core';
import supportsAnchorPositioning from '../utils/supports-anchor-positioning.js';

export interface AccentedTrigger extends HTMLElement {
  dialog: AccentedDialog | undefined;
  position: Signal<Position> | undefined;
}

// We want Accented to not throw an error in Node, and use static imports,
// so we can't export `class extends HTMLElement` because HTMLElement is not available in Node.
export default (name: string) => {
  const template = document.createElement('template');

  // I initially tried creating a CSSStyelSheet object with styles instead of having a <style> element in the template,
  // but that led to a hard-to-catch layout bug in Safari in CI that caused a test to fail.
  // It seems that when using adoptedStyleSheets, the styles may be applied asynchronously,
  // which may have caused the layout bug.
  // Using a <style> element does not seem to lead to any performance issues, so I'm keeping it this way.
  template.innerHTML = `
    <style>
      :host {
        all: initial;
        position: fixed;
        inset-inline-end: anchor(end);
        inset-block-start: anchor(start);

        /* Popover-specific stuff */
        border: none;
        padding: 0;
        margin-inline-end: 0;
        margin-block-end: 0;
      }

      #trigger {
        box-sizing: border-box;
        font-size: 1rem;
        inline-size: max(32px, 2rem);
        block-size: max(32px, 2rem);

        /* Make it look better in forced-colors mode, */
        border: 2px solid transparent;

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
    </style>
    <button id="trigger">⚠</button>
  `;

  return class extends HTMLElement implements AccentedTrigger {
    #abortController: AbortController | undefined;

    #disposeOfEffect: (() => void) | undefined;

    dialog: AccentedDialog | undefined;

    position: Signal<Position> | undefined;

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      const content = template.content.cloneNode(true);
      if (this.shadowRoot) {
        this.shadowRoot.append(content);
      }
    }

    connectedCallback() {
      if (this.shadowRoot) {
        const { shadowRoot } = this;
        const trigger = shadowRoot.getElementById('trigger');
        this.#abortController = new AbortController();
        trigger?.addEventListener('click', (event) => {
          event.preventDefault();
          this.dialog?.showModal();
        }, { signal: this.#abortController.signal });

        if (!supportsAnchorPositioning()) {
          this.#disposeOfEffect = effect(() => {
            if (this.position && trigger) {
              const position = this.position.value;
              this.style.top = `${position.blockStartTop}px`;
              if (position.direction === 'ltr') {
                // TODO: calculate width dynamically
                this.style.left = `${position.inlineEndLeft - 32}px`;
              } else if (this.position.value.direction === 'rtl') {
                this.style.left = `${position.inlineEndLeft}px`;
              }
            }
          });
        }
      }
    }

    disconnectedCallback() {
      if (this.#abortController) {
        this.#abortController.abort();
      }
      if (this.#disposeOfEffect) {
        this.#disposeOfEffect();
        this.#disposeOfEffect = undefined;
      }
    }
  };
};

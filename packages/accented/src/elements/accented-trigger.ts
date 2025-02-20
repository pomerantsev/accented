import type { AccentedDialog } from './accented-dialog';
import type { Position } from '../types';
import { effect } from '@preact/signals-core';
import type { Signal } from '@preact/signals-core';
import supportsAnchorPositioning from '../utils/supports-anchor-positioning.js';
import logAndRethrow from '../log-and-rethrow.js';

export interface AccentedTrigger extends HTMLElement {
  element: Element | undefined;
  dialog: AccentedDialog | undefined;
  position: Signal<Position> | undefined;
  visible: Signal<boolean> | undefined;
}

const triggerSize = 'max(32px, 2rem)';

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
        position: fixed !important;
        inset-inline-end: anchor(self-end) !important;
        inset-block-start: anchor(self-start) !important;

        position-visibility: anchors-visible !important;

        /* Revert potential effects of white-space: pre; set on a trigger's ancestor. */
        white-space: normal !important;
      }

      #trigger {
        box-sizing: border-box;
        font-size: 1rem;
        inline-size: ${triggerSize};
        block-size: ${triggerSize};

        /* Make it look better in forced-colors mode. */
        border: 2px solid transparent;

        background-color: var(--${name}-primary-color);
        color: var(--${name}-secondary-color);

        outline-offset: -4px;
        outline-color: currentColor;
        outline-width: 2px;
        outline-style: none;

        &:focus-visible {
          outline-style: solid;
        }

        &:hover:not(:focus-visible) {
          outline-style: dashed;
        }
      }
    </style>
    <button id="trigger" lang="en">⚠</button>
  `;

  return class extends HTMLElement implements AccentedTrigger {
    #abortController: AbortController | undefined;

    #dialogCloseAbortController: AbortController | undefined;

    #disposeOfPositionEffect: (() => void) | undefined;

    #disposeOfVisibilityEffect: (() => void) | undefined;

    element: Element | undefined;

    dialog: AccentedDialog | undefined;

    position: Signal<Position> | undefined;

    visible: Signal<boolean> | undefined;

    constructor() {
      try {
        super();
        this.attachShadow({ mode: 'open' });
        const content = template.content.cloneNode(true);
        if (this.shadowRoot) {
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
          const trigger = shadowRoot.getElementById('trigger');
          if (trigger && this.element) {
            trigger.ariaLabel = `Accessibility issues in ${this.element.nodeName.toLowerCase()}`;
          }
          this.#abortController = new AbortController();
          trigger?.addEventListener('click', (event) => {
            try {
              event.preventDefault();

              // We append the dialog when the button is clicked,
              // and remove it from the DOM when the dialog is closed.
              // This gives us a performance improvement since Axe
              // scan time seems to depend on the number of elements in the DOM.
              if (this.dialog) {
                this.#dialogCloseAbortController = new AbortController();
                document.body.append(this.dialog);
                this.dialog.showModal();
                this.dialog.addEventListener('close', () => {
                  try {
                    this.dialog?.remove();
                    this.#dialogCloseAbortController?.abort();
                  } catch (error) {
                    logAndRethrow(error);
                  }
                }, { signal: this.#dialogCloseAbortController.signal });
              }
            } catch (error) {
              logAndRethrow(error);
            }
          }, { signal: this.#abortController.signal });

          if (!supportsAnchorPositioning(window)) {
            this.#disposeOfPositionEffect = effect(() => {
              if (this.position && trigger) {
                const position = this.position.value;
                this.style.setProperty('top', `${position.blockStartTop}px`, 'important');
                if (position.direction === 'ltr') {
                  this.style.setProperty('left', `calc(${position.inlineEndLeft}px - ${triggerSize})`, 'important');
                } else if (this.position.value.direction === 'rtl') {
                  this.style.setProperty('left', `${position.inlineEndLeft}px`, 'important');
                }
              }
            });

            this.#disposeOfVisibilityEffect = effect(() => {
              this.style.setProperty('visibility', this.visible?.value ? 'visible' : 'hidden', 'important');
            });
          }
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
        if (this.#dialogCloseAbortController) {
          this.#dialogCloseAbortController.abort();
          this.dialog?.remove();
        }
        if (this.#disposeOfPositionEffect) {
          this.#disposeOfPositionEffect();
          this.#disposeOfPositionEffect = undefined;
        }
        if (this.#disposeOfVisibilityEffect) {
          this.#disposeOfVisibilityEffect();
          this.#disposeOfVisibilityEffect = undefined;
        }
      } catch (error) {
        logAndRethrow(error);
      }
    }
  };
};

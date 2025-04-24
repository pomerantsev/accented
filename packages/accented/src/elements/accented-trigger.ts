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
        --ratio: 1.2;
        --base-size: max(1rem, 16px);
        position: fixed !important;
        inset-inline-start: anchor(self-start) !important;
        inset-inline-end: anchor(self-end) !important;
        inset-block-start: anchor(self-start) !important;
        inset-block-end: anchor(self-end) !important;

        position-visibility: anchors-visible !important;

        /* Revert potential effects of white-space: pre; set on a trigger's ancestor. */
        white-space: normal !important;

        pointer-events: none !important;
      }

      #trigger {
        pointer-events: auto;

        margin-inline-start: auto;
        margin-inline-end: 4px;
        margin-block-start: 4px;

        box-sizing: border-box;
        font-family: system-ui;
        font-size: calc(var(--ratio) * var(--ratio) * var(--base-size));
        inline-size: calc(2 * var(--base-size));
        block-size: calc(2 * var(--base-size));

        display: flex;
        align-items: center;
        justify-content: center;

        /* Make it look better in forced-colors mode. */
        border: 2px solid transparent;

        background-color: var(--${name}-primary-color);
        color: var(--${name}-secondary-color);

        padding: 0;

        border-radius: calc(0.25 * var(--base-size));

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
    <button id="trigger" lang="en">á</button>
  `;

  return class extends HTMLElement implements AccentedTrigger {
    #abortController: AbortController | undefined;

    #dialogCloseAbortController: AbortController | undefined;

    #disposeOfPositionEffect: (() => void) | undefined;

    #disposeOfVisibilityEffect: (() => void) | undefined;

    #elementMutationObserver: MutationObserver | undefined;

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

          this.#setTransform();

          this.#elementMutationObserver = new MutationObserver(() => {
            try {
              this.#setTransform();
            } catch (error) {
              logAndRethrow(error);
            }
          });

          if (this.element) {
            this.#elementMutationObserver.observe(this.element, {
              attributes: true
            });
          }

          this.#abortController = new AbortController();
          trigger?.addEventListener('click', (event) => {
            try {
              // event.preventDefault() ensures that if the issue is within a link,
              // the link's default behavior (following the URL) is prevented.
              event.preventDefault();

              // event.stopPropagation() ensures that if there's a click handler on the trigger's ancestor
              // (a link, or a button, or anything else), it doesn't get triggered.
              event.stopPropagation();

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
                this.style.setProperty('top', `${position.top}px`, 'important');
                this.style.setProperty('left', `${position.left}px`, 'important');
                this.style.setProperty('width', `${position.width}px`, 'important');
                this.style.setProperty('height', `${position.height}px`, 'important');
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
        if (this.#dialogCloseAbortController && !this.dialog?.open) {
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
        if (this.#elementMutationObserver) {
          this.#elementMutationObserver.disconnect();
        }
      } catch (error) {
        logAndRethrow(error);
      }
    }

    #setTransform() {
      // We read and write values in separate animation frames to avoid layout thrashing.
      window.requestAnimationFrame(() => {
        if (this.element) {
          const transform = window.getComputedStyle(this.element).getPropertyValue('transform');
          if (transform !== 'none') {
            window.requestAnimationFrame(() => {
              this.style.setProperty('transform', transform, 'important');
            });
          }
        }
      });
    }
  };
};

import type { AccentedDialog } from './accented-dialog';

export interface AccentedTrigger extends HTMLElement {
  dialog: AccentedDialog | undefined;
}

// We want Accented to not throw an error in Node, and use static imports,
// so we can't export `class extends HTMLElement` because HTMLElement is not available in Node.
export default (name: string) => {
  const template = document.createElement('template');
  template.innerHTML = `
    <button id="trigger">⚠</button>
  `;

  const stylesheet = new CSSStyleSheet();
  stylesheet.replaceSync(`
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
  `);

  return class extends HTMLElement implements AccentedTrigger {
    #abortController: AbortController | undefined;

    dialog: AccentedDialog | undefined;

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      const content = template.content.cloneNode(true);
      if (this.shadowRoot) {
        this.shadowRoot.adoptedStyleSheets.push(stylesheet);
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
      }
    }

    disconnectedCallback() {
      if (this.#abortController) {
        this.#abortController.abort();
      }
    }
  };
};

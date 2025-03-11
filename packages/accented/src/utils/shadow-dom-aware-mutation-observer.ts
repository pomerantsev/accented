import { isElement, isDocument, isDocumentFragment } from './dom-helpers.js';
import { getAccentedElementNames } from '../constants.js';

export default function createShadowDOMAwareMutationObserver (name: string, callback: MutationCallback) {
  class ShadowDOMAwareMutationObserver extends MutationObserver {
    #shadowRoots = new Set();

    #options: MutationObserverInit | undefined;

    constructor(callback: MutationCallback) {
      super((mutations, observer) => {
        const accentedElementNames = getAccentedElementNames(name);
        const newElements = mutations
          .filter(mutation => mutation.type === 'childList')
          .map(mutation => [...mutation.addedNodes])
          .flat()
          .filter(node => isElement(node))
          .filter(node => !accentedElementNames.includes(node.nodeName.toLowerCase()));

        this.#observeShadowRoots(newElements);

        // TODO: remove shadow roots that are no longer in the DOM

        callback(mutations, observer);
      });
    }

    override observe(target: Node, options?: MutationObserverInit): void {
      this.#options ??= options;
      if (isElement(target) || isDocument(target) || isDocumentFragment(target)) {
        this.#observeShadowRoots([target]);
      }
      super.observe(target, options);
    }

    #observeShadowRoots = (elements: Array<Element | Document | DocumentFragment>) => {
      const shadowRoots = elements
        .map(element => [...element.querySelectorAll('*')])
        .flat()
        .filter(element => element.shadowRoot)
        .map(element => element.shadowRoot!);

      for (const shadowRoot of shadowRoots) {
        this.#shadowRoots.add(shadowRoot);
        this.observe(shadowRoot, this.#options);
      }
    }
  }

  return new ShadowDOMAwareMutationObserver(callback);
}

import { getAccentedElementNames } from '../constants.js';
import { isDocument, isDocumentFragment, isElement } from './dom-helpers.js';

export function createShadowDOMAwareMutationObserver(name: string, callback: MutationCallback) {
  class ShadowDOMAwareMutationObserver extends MutationObserver {
    #shadowRoots = new Set();

    #options: MutationObserverInit | undefined;

    constructor(callback: MutationCallback) {
      super((mutations, observer) => {
        const accentedElementNames = getAccentedElementNames(name);
        const childListMutations = mutations.filter((mutation) => mutation.type === 'childList');

        const newElements = childListMutations
          .flatMap((mutation) => [...mutation.addedNodes])
          .filter((node) => isElement(node))
          .filter((node) => !accentedElementNames.includes(node.nodeName.toLowerCase()));

        this.#observeShadowRoots(newElements);

        const removedElements = childListMutations
          .flatMap((mutation) => [...mutation.removedNodes])
          .filter((node) => isElement(node))
          .filter((node) => !accentedElementNames.includes(node.nodeName.toLowerCase()));

        // Mutation observer has no "unobserve" method, so we're simply deleting
        // the elements from the set of shadow roots.
        this.#deleteShadowRoots(removedElements);

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

    override disconnect(): void {
      this.#shadowRoots.clear();
      super.disconnect();
    }

    #observeShadowRoots = (elements: Array<Element | Document | DocumentFragment>) => {
      const shadowRoots = elements
        .flatMap((element) => [...element.querySelectorAll('*')])
        .filter((element) => element.shadowRoot)
        .map((element) => element.shadowRoot);

      for (const shadowRoot of shadowRoots) {
        if (shadowRoot) {
          this.#shadowRoots.add(shadowRoot);
          this.observe(shadowRoot, this.#options);
        }
      }
    };

    #deleteShadowRoots = (elements: Array<Element | Document | DocumentFragment>) => {
      const shadowRoots = elements
        .flatMap((element) => [...element.querySelectorAll('*')])
        .filter((element) => element.shadowRoot)
        .map((element) => element.shadowRoot);

      for (const shadowRoot of shadowRoots) {
        this.#shadowRoots.delete(shadowRoot);
      }
    };
  }

  return new ShadowDOMAwareMutationObserver(callback);
}

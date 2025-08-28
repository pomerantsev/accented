import { getAccentedElementNames } from '../constants.js';
import { isDocument, isDocumentFragment, isElement } from './dom-helpers.js';

function getShadowRoots(elements: Array<Element | Document | DocumentFragment>) {
  return elements
    .flatMap((element) => Array.from(element.querySelectorAll('*')))
    .reduce<Array<ShadowRoot>>(
      (acc, element) => (element.shadowRoot ? acc.concat(element.shadowRoot) : acc),
      [],
    );
}

export function createShadowDOMAwareMutationObserver(name: string, callback: MutationCallback) {
  type ObserverMap = Map<ShadowRoot, ShadowDOMAwareMutationObserver>;

  const accentedElementNames = getAccentedElementNames(name);

  function getMutationNodes(mutations: Array<MutationRecord>, type: 'addedNodes' | 'removedNodes') {
    return mutations
      .filter((mutation) => mutation.type === 'childList')
      .flatMap((mutation) => Array.from(mutation[type]))
      .filter((node) => isElement(node))
      .filter((node) => !accentedElementNames.includes(node.nodeName.toLowerCase()));
  }

  class ShadowDOMAwareMutationObserver extends MutationObserver {
    #shadowRoots: ObserverMap = new Map();

    #options: MutationObserverInit | undefined;

    constructor(mutationCallback: MutationCallback) {
      super((mutations, observer) => {
        const newElements = getMutationNodes(mutations, 'addedNodes');

        this.#observeShadowRoots(newElements);

        const removedElements = getMutationNodes(mutations, 'removedNodes');

        // Mutation observer has no "unobserve" method, so we're simply deleting
        // the elements from the set of shadow roots.
        this.#unobserveShadowRoots(removedElements);

        mutationCallback(mutations, observer);
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
      this.#unobserveShadowRoots(Array.from(this.#shadowRoots.keys()));
      this.#shadowRoots.clear();
      super.disconnect();
    }

    #observeShadowRoots = (elements: Array<Element | Document | DocumentFragment>) => {
      const shadowRoots = getShadowRoots(elements);

      for (const shadowRoot of shadowRoots) {
        const observer = new ShadowDOMAwareMutationObserver(callback);
        observer.observe(shadowRoot, this.#options);
        this.#shadowRoots.set(shadowRoot, observer);
      }
    };

    #unobserveShadowRoots = (elements: Array<Element | Document | DocumentFragment>) => {
      const shadowRoots = getShadowRoots(elements);

      for (const shadowRoot of shadowRoots) {
        this.#shadowRoots.get(shadowRoot)?.disconnect();
        this.#shadowRoots.delete(shadowRoot);
      }
    };
  }

  return new ShadowDOMAwareMutationObserver(callback);
}

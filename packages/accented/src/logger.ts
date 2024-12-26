import state from './state.js';
import areSetsEqual from './utils/are-sets-equal.js';

export default function createLogger() {
  let previousElements: Array<Element> = [];
  document.addEventListener('accentedUpdate', () => {
    if (!areSetsEqual(new Set(previousElements), new Set(state.elements))) {
      console.log('Elements:', state.elements);
    }
    previousElements = [...state.elements];
  }, {signal: state.abortController.signal});
  return () => {};
}

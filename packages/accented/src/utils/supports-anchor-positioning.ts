// ATTENTION: sync with the implementation in end-to-end tests.
// I didn't find a way to sync this with automatically with the implementation of supportsAnchorPositioning
// in end-to-end tests, so it has to be synced manually.
export function supportsAnchorPositioning() {
  return CSS.supports('anchor-name: --foo') && CSS.supports('position-anchor: --foo');
}

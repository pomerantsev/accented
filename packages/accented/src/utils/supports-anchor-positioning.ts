export default function supportsAnchorPositioning() {
  return CSS.supports('anchor-name: --foo') && CSS.supports('position-anchor: --foo');
}

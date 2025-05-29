type WindowWithCSS = Window & {
  CSS: typeof CSS;
};

export default function supportsAnchorPositioning(win: WindowWithCSS) {
  return win.CSS.supports('anchor-name: --foo') && win.CSS.supports('position-anchor: --foo');
}

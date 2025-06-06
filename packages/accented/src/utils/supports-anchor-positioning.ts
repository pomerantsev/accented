type WindowWithCSS = Window & {
  CSS: typeof CSS;
};

export function supportsAnchorPositioning(win: WindowWithCSS) {
  return win.CSS.supports('anchor-name: --foo') && win.CSS.supports('position-anchor: --foo');
}

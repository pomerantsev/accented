type WindowWithCSS = Window & {
  CSS: typeof CSS;
};

/**
 * We have to do browser sniffing now and explicitly turn off Anchor positioning in Safari
 * since anchor positioning is not working correctly in Safari 26 Technology Preview.
 */
function isWebKit(win: Window) {
  const ua = win.navigator.userAgent;
  return (/AppleWebKit/.test(ua) && !/Chrome/.test(ua)) || /\b(iPad|iPhone|iPod)\b/.test(ua);
}

// ATTENTION: sync with the implementation in end-to-end tests.
// I didn't find a way to sync this with automatically with the implementation of supportsAnchorPositioning
// in end-to-end tests, so it has to be synced manually.
export function supportsAnchorPositioning(win: WindowWithCSS) {
  return (
    win.CSS.supports('anchor-name: --foo') &&
    win.CSS.supports('position-anchor: --foo') &&
    !isWebKit(win)
  );
}

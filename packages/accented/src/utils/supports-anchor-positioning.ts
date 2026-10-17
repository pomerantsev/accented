/**
 * We have to do browser sniffing now and explicitly turn off anchor positioning in Safari 26
 * since anchor positioning is enabled there but is buggy:
 * https://bugs.webkit.org/show_bug.cgi?id=304551.
 */
export function isSafari26(ua = navigator.userAgent) {
  return (
    (/AppleWebKit/.test(ua) && !/Chrome/.test(ua) && /Version\/26\b/.test(ua)) ||
    // Also covers non-Safari iOS browsers, since they're all WebKit under the hood.
    (/\b(iPad|iPhone|iPod)\b/.test(ua) && /\bOS 26_\d/.test(ua))
  );
}

export function supportsAnchorPositioning() {
  return (
    CSS.supports('anchor-name: --foo') && CSS.supports('position-anchor: --foo') && !isSafari26()
  );
}

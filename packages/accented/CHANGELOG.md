# accented

## 1.0.0

### Major Changes

- [#129](https://github.com/pomerantsev/accented/pull/129) [`0724ad9`](https://github.com/pomerantsev/accented/commit/0724ad9db94138c0b4ee024ad705afbb3f3360dd) Thanks [@pomerantsev](https://github.com/pomerantsev)! - - Improve runtime performance by only re-scanning the changed parts of the DOM.

  - Rename `axeContext` to `context`.

- [#127](https://github.com/pomerantsev/accented/pull/127) [`39b8b6f`](https://github.com/pomerantsev/accented/commit/39b8b6fbba0babd80b27545fd6b5fa3a20741d56) Thanks [@pomerantsev](https://github.com/pomerantsev)! - Change signature of `callback` by adding the DOM update duration

- [#155](https://github.com/pomerantsev/accented/pull/155) [`bf53ec2`](https://github.com/pomerantsev/accented/commit/bf53ec272e7382e3593c078962affa0b5ebe9c8f) Thanks [@pomerantsev](https://github.com/pomerantsev)! - Use named exports everywhere (including the external export)

### Minor Changes

- [#136](https://github.com/pomerantsev/accented/pull/136) [`e9a9435`](https://github.com/pomerantsev/accented/commit/e9a94352411c13742010bbe6f04d71d30b59ad6c) Thanks [@pomerantsev](https://github.com/pomerantsev)! - Stop rendering issues in nested SVGs

- [#145](https://github.com/pomerantsev/accented/pull/145) [`a9228e6`](https://github.com/pomerantsev/accented/commit/a9228e6c60259a044c6e275eb95c1a12dbbb3d69) Thanks [@pomerantsev](https://github.com/pomerantsev)! - Add a `performance.scanContext` prop to callback

- [#162](https://github.com/pomerantsev/accented/pull/162) [`9ecae50`](https://github.com/pomerantsev/accented/commit/9ecae507f304b4096c0845d9be5f61263321e672) Thanks [@pomerantsev](https://github.com/pomerantsev)! - Move `scanContext` from `performance` to root of callback prop object

- [#125](https://github.com/pomerantsev/accented/pull/125) [`07041ab`](https://github.com/pomerantsev/accented/commit/07041ab2836645799207b0da12d85d8c72e83326) Thanks [@pomerantsev](https://github.com/pomerantsev)! - Implement scanning and issue highlighting in open shadow DOM

### Patch Changes

- [#117](https://github.com/pomerantsev/accented/pull/117) [`081900b`](https://github.com/pomerantsev/accented/commit/081900b98323f0b4b66a6599571fe0a741b7e65a) Thanks [@pomerantsev](https://github.com/pomerantsev)! - Fix positioning of triggers on elements that have CSS transforms applied

- [#166](https://github.com/pomerantsev/accented/pull/166) [`47e696c`](https://github.com/pomerantsev/accented/commit/47e696c76cf5fe125a12f4f7b53d22b3bfdf30dd) Thanks [@pomerantsev](https://github.com/pomerantsev)! - Disable asset preloading (which could result in CORS errors)

- [#151](https://github.com/pomerantsev/accented/pull/151) [`a6c1640`](https://github.com/pomerantsev/accented/commit/a6c1640a1770d49aebb896b384572cad9246c3eb) Thanks [@pomerantsev](https://github.com/pomerantsev)! - Remove `rootNode` from console output

- [#131](https://github.com/pomerantsev/accented/pull/131) [`facefaa`](https://github.com/pomerantsev/accented/commit/facefaac4fe545b808ca6e2a1f60433abda8713c) Thanks [@pomerantsev](https://github.com/pomerantsev)! - Update appearance

- [#148](https://github.com/pomerantsev/accented/pull/148) [`91be9c7`](https://github.com/pomerantsev/accented/commit/91be9c74e0340e9a45eb5f08c987f137acdcadd1) Thanks [@pomerantsev](https://github.com/pomerantsev)! - Fix trigger positioning in containing blocks in Safari and Firefox

- [#123](https://github.com/pomerantsev/accented/pull/123) [`0f610a0`](https://github.com/pomerantsev/accented/commit/0f610a0d8f8132224a766945fad7f4518d3fb7aa) Thanks [@pomerantsev](https://github.com/pomerantsev)! - Prevent click handlers on ancestors of triggers from being invoked

- [#139](https://github.com/pomerantsev/accented/pull/139) [`41e2f7e`](https://github.com/pomerantsev/accented/commit/41e2f7ed2fcec55a82b3fc41a2059653fd7abac3) Thanks [@pomerantsev](https://github.com/pomerantsev)! - Stop rendering issues on <head> and its descendants

- [#154](https://github.com/pomerantsev/accented/pull/154) [`9553194`](https://github.com/pomerantsev/accented/commit/95531947e611860372341745e5caae6f390210fc) Thanks [@pomerantsev](https://github.com/pomerantsev)! - Small fixes to satisfy new linter

- [#134](https://github.com/pomerantsev/accented/pull/134) [`027fca1`](https://github.com/pomerantsev/accented/commit/027fca1d692fbf0382998851a0fb4fed9fd66ee8) Thanks [@pomerantsev](https://github.com/pomerantsev)! - Add MPL-2.0 license notice

- [#146](https://github.com/pomerantsev/accented/pull/146) [`5600435`](https://github.com/pomerantsev/accented/commit/560043513e8c72d171273e63fbb1e284a5f5800d) Thanks [@pomerantsev](https://github.com/pomerantsev)! - Update character on the trigger

- [#120](https://github.com/pomerantsev/accented/pull/120) [`353d62e`](https://github.com/pomerantsev/accented/commit/353d62eb815224575efb5c3710f304ebf988a720) Thanks [@pomerantsev](https://github.com/pomerantsev)! - Stop showing issues that may be caused by Accented itself

- [#123](https://github.com/pomerantsev/accented/pull/123) [`0d18733`](https://github.com/pomerantsev/accented/commit/0d187333160b4e9d6fff42092ca5f7f86cb56fde) Thanks [@pomerantsev](https://github.com/pomerantsev)! - Increase text-to-background contrast ratio in triggers

- [#144](https://github.com/pomerantsev/accented/pull/144) [`98d61a9`](https://github.com/pomerantsev/accented/commit/98d61a9bc0f5ec57d732bb737493f7a5e6adad87) Thanks [@pomerantsev](https://github.com/pomerantsev)! - Ensure the Accented trigger is always visible on a <summary>

- [#162](https://github.com/pomerantsev/accented/pull/162) [`04e25d4`](https://github.com/pomerantsev/accented/commit/04e25d4454ea28cb3622bcd3677790fe27760ddc) Thanks [@pomerantsev](https://github.com/pomerantsev)! - Fix deep-merge (nodes must not be merged)

- [#115](https://github.com/pomerantsev/accented/pull/115) [`ba8bd4f`](https://github.com/pomerantsev/accented/commit/ba8bd4f056d5d43245857fdc7e931f1350a3096c) Thanks [@pomerantsev](https://github.com/pomerantsev)! - Fix propagation of Esc press (PR #114)

- [#128](https://github.com/pomerantsev/accented/pull/128) [`c06ecfb`](https://github.com/pomerantsev/accented/commit/c06ecfb3e9476e92f64c274a59f2c0335100b8b5) Thanks [@pomerantsev](https://github.com/pomerantsev)! - Fix layout thrashing issue

- [#124](https://github.com/pomerantsev/accented/pull/124) [`83cbdb7`](https://github.com/pomerantsev/accented/commit/83cbdb7584dfd5318f9bcfb72998fb9993dbcf44) Thanks [@pomerantsev](https://github.com/pomerantsev)! - Make font sizes legible regardless of the document's base font size

- [#162](https://github.com/pomerantsev/accented/pull/162) [`8549d90`](https://github.com/pomerantsev/accented/commit/8549d90839d4c57bd80df91d10ee8046cfad3d0a) Thanks [@pomerantsev](https://github.com/pomerantsev)! - Disable user text selection on trigger

- [#112](https://github.com/pomerantsev/accented/pull/112) [`6e93f54`](https://github.com/pomerantsev/accented/commit/6e93f549744e1973c58a3852d00d3bed47a4d7c4) Thanks [@pomerantsev](https://github.com/pomerantsev)! - Fix trigger positioning within transformed elements in Safari and Firefox

- [#152](https://github.com/pomerantsev/accented/pull/152) [`c93c29d`](https://github.com/pomerantsev/accented/commit/c93c29d1dd2c2aed8dea8d06d6b137f735332c93) Thanks [@pomerantsev](https://github.com/pomerantsev)! - Ensure that dialog doesn't disappear by itself (without user closing it)

- [#140](https://github.com/pomerantsev/accented/pull/140) [`e1d1c78`](https://github.com/pomerantsev/accented/commit/e1d1c786c65d97847c69d9a8f58a42a5e2d07db4) Thanks [@pomerantsev](https://github.com/pomerantsev)! - Stop Accented from breaking table layouts

- [#138](https://github.com/pomerantsev/accented/pull/138) [`3ac5022`](https://github.com/pomerantsev/accented/commit/3ac502245f3a1aad99c68790f5293da1713a7b71) Thanks [@pomerantsev](https://github.com/pomerantsev)! - Fix deduplication algorithm

- [#160](https://github.com/pomerantsev/accented/pull/160) [`ba99f81`](https://github.com/pomerantsev/accented/commit/ba99f81e7a95e811178fe9936ce44ef1f36949f3) Thanks [@pomerantsev](https://github.com/pomerantsev)! - Fix trigger visibility in Chrome when overflowing overflow: visible containers

- [#147](https://github.com/pomerantsev/accented/pull/147) [`603a30c`](https://github.com/pomerantsev/accented/commit/603a30c5edfb8ed9d3a229418a22576b0271f042) Thanks [@pomerantsev](https://github.com/pomerantsev)! - Upgrade axe-core and typescript

Accented strives to adhere to [SemVer](https://semver.org/).

See [Versioning policy](https://www.accented.dev/about#versioning).

## 0.0.2

Initial preview release

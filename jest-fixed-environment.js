const JSDOMEnvironment = require('jest-environment-jsdom');

/**
 * jsdom installs its own copies of `ArrayBuffer`, `Uint8Array`, etc. on the test `global`, distinct
 * from the realm Node's `Buffer` and the rest of the platform use. That makes `nodeBuffer instanceof
 * Uint8Array` (and similar cross-realm checks) `false` inside tests. Newer `@noble/hashes` — bundled
 * by `@taquito/signer` 24.3 — relies on such checks, which broke decrypting encrypted secret keys.
 *
 * Aligning Node's typed-array constructors into the jsdom realm here (before any module loads) makes
 * Node `Buffer`s genuinely share the realm's `Uint8Array`, fixing the whole class of mismatch at the
 * source rather than per-API. The real browser is unaffected — it uses same-realm polyfills.
 */
module.exports = class FixedJSDOMEnvironment extends JSDOMEnvironment {
  constructor(...args) {
    super(...args);

    this.global.ArrayBuffer = ArrayBuffer;
    this.global.Uint8Array = Uint8Array;
    this.global.DataView = DataView;
  }
};

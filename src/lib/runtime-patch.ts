/*
  Package `regenerator-runtime@0.13.7` has "unsafe" for the Manifest V3 code in it.
  We don't rely on it directly, yet, its code is bundled into `@temple-wallet/ledger-bridge@2.0.1`.
  This patch resolves issues inside such packages.
*/

// import 'regenerator-runtime/runtime';

(globalThis as any).regeneratorRuntime = (globalThis as any).regeneratorRuntime || undefined;

export {};

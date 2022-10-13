- Check `browser.i18n.getMessage`. Solved since 103.0.5060.134? Good enough? See:
- - https://www.giters.com/w3c/webextensions/issues/93
- - https://groups.google.com/a/chromium.org/g/chromium-extensions/c/dG6JeZGkN5w?pli=1
- Restore fully `localStorage` reliant features
- - ! `lib/temple/ledger-live>pickLedgerTransport()`
- - `lib/temple/vault>Vault.spawn()` // See changes below
- - `lib/i18n/saving.ts>getSavedLocale()`
- - `lib/ui/useLockUp.ts>isLockUpEnabled()`
- `wasm-unsafe-eval` works only for Chrome v102+
- Get rid of runtime patch
- Get rid of XHR polyfill
- - PR to `taquito` ?
- Remove references
- - `lib` -> `app`
- - `lib` -> `/front`
- - `back` -> `app`
- - `back` -> `front`
- Discard browser environment usage for BG script at the language level
- PR to `@tezos-domains`
- Get rid of `eslint-loader`
- Restore hot-reload


### Changes

1. Removed from `lib/temple/back/vault>Vault.spawn()`

```typescript
  const onboarding = localStorage.getItem('onboarding');
  const analytics = localStorage.getItem('analytics');

  await clearStorages();
  try {
    localStorage.setItem('onboarding', onboarding!);
    localStorage.setItem('analytics', analytics!);
  } catch {}
```

+ `clearStorages` doesn't clear `localStorage` from BG

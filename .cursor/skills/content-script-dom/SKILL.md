---
name: content-script-dom
description: >-
  Content-script DOM and i18n helpers in Temple Wallet. Use when writing or
  changing content scripts, shadow DOM overlays, website popups, web widgets,
  temple-deals, or any first-party document.createElement / browser.i18n.getMessage
  outside the React app.
---

# Content-script DOM and i18n

## Create elements with `el()`

`el()` lives in `src/lib/el.ts` with `HTMLElementTagNameMap` overloads. First-party `document.createElement` should go through it.

```ts
const button = el('button', 'close', 'Close'); // HTMLButtonElement
```

Do not use `el()` for third-party embed scripts (for example `hypelab.embed.js`).

## i18n with `msg()`

Content-script i18n uses `msg()` from `src/lib/msg.ts` (`browser.i18n.getMessage(key, substitutions) || key`). Do not call `browser.i18n.getMessage` directly in recently changed content-script files.

Plural keys in content scripts use `Intl.PluralRules` with `getNativeLocale()`, not `getPluralKey` from the React i18n helpers.

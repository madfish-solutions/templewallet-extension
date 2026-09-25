---
name: account-notifications
description: >-
  Account-notification architecture for Temple Wallet: shared lib types, locked-wallet
  WebSocket addresses, in-wallet popup ads analytics, and Objkt image fallback.
  Use when working on notifications, Objkt NFT activity, account-notification popups,
  notification WebSocket, notification ads, or files under src/lib/notifications,
  src/app/store/notifications, src/app/pages/Notifications, or
  src/content-scripts/account-notifications-popup.
---

# Account notifications

Shared types and helpers live in `src/lib/notifications/`. Content scripts, background, store, and UI must import these from `lib/`, never from a page or from each other.

## Locked wallet

Keep Tezos subscription addresses in `ACCOUNT_NOTIFICATION_ADDRESSES` (`ACCOUNT_NOTIFICATION_ADDRESSES_STORAGE_KEY`) so the background WebSocket stays subscribed while the wallet is locked. Do not disconnect on lock.

## Popup ads

Gate display with the **in-wallet ads** switcher, not webpage ads. Impressions use page name `Account notification popup` (`ACCOUNT_NOTIFICATION_POPUP_AD_PAGE_NAME`), not `WebWidgetAdImpression` or `NOTIFICATIONS_PAGE_NAME`.

- **In-wallet popup:** `PartnersPromotion` Text / `HypelabTextPromotion` (Hypelab native SDK). Do not use the ads-window iframe here; that proxy is slower and is meant for websites.
- **Website overlay:** HypeLab native iframe (`CardAd` pattern) via `AccountNotificationAdContext` / `AccountNotificationAdImpression`. The React SDK is not available in the content script.

## Objkt image fallback

Use `OBJKT_NOTIFICATION_FALLBACK_IMAGE_URL` (`public/misc/objkt-notification-fallback.svg`). Show it while the backend `extensionImageUrl` loads and if that image is missing, unsafe, or fails. Use `subscribeAccountNotificationImageSrc` / `bindAccountNotificationImage` / `AccountNotificationImage`.

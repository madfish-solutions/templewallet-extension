# Thanos Wallet

Cryptocurrency wallet for [Tezos blockchain](https://tezos.com) as Web Extension for your Browser.<br>
Providing ability to manage NFT, XTZ tokens and interact with dApps.

![Thanos Wallet](https://user-images.githubusercontent.com/11996139/78780449-46a5ed00-79a7-11ea-98ab-0c5cdc57fe8a.png)

<hr />

## ▶️ Beta

You can install Beta right now: https://thanoswallet.com/download.


## Browser Support

| [![Chrome](https://raw.github.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png)](https://chrome.google.com/webstore/detail/thanos-wallet/ookjlbkiijinhpmnjffcofjonbfbgaoc) | [![Firefox](https://raw.github.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png)](https://addons.mozilla.org/en-US/firefox/addon/thanos-wallet/) | [![Brave](https://raw.github.com/alrra/browser-logos/master/src/brave/brave_48x48.png)](https://chrome.google.com/webstore/detail/thanos-wallet/ookjlbkiijinhpmnjffcofjonbfbgaoc) | [![Opera](https://raw.github.com/alrra/browser-logos/master/src/opera/opera_48x48.png)](https://thanoswallet.com/download) | [![Edge](https://raw.github.com/alrra/browser-logos/master/src/edge/edge_48x48.png)](https://thanoswallet.com/download) | [![Yandex](https://raw.github.com/alrra/browser-logos/master/src/yandex/yandex_48x48.png)](https://thanoswallet.com/download) | [![vivaldi](https://raw.github.com/alrra/browser-logos/master/src/vivaldi/vivaldi_48x48.png)](https://thanoswallet.com/download) |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 49 & later ✔                                                                                                                                                                         | 52 & later ✔                                                                                                                                                 | Latest ✔                                                                                                                                                                          | 36 & later 🔜                                                                                                               | 79 & later 🔜                                                                                                            | Latest 🔜                                                                                                                      | Latest 🔜                                                                                                                         |

## 🚀 Quick Start

Ensure you have:

- [Node.js](https://nodejs.org) 10 or later installed
- [Yarn](https://yarnpkg.com) v1 or v2 installed

Then run the following:

### 1) Clone the repository

```bash
git clone https://github.com/madfish-solutions/thanos-wallet && cd thanos-wallet
```

### 2) Install dependencies

```bash
yarn
```

### 3) Build

Builds the extension for production to the `dist` folder.<br>
It correctly bundles in production mode and optimizes the build for the best performance.

```bash
# for Chrome by default
yarn build
```

Optional for different browsers:

```bash
# for Chrome directly
yarn build:chrome
# for Firefox directly
yarn build:firefox
# for Opera directly
yarn build:opera

# for all at once
yarn build-all
```

### 4) Load extension to your Browser

![ThanosWallet_Load](https://user-images.githubusercontent.com/11996139/73763346-f8435a80-4779-11ea-9e9d-4c1db9560f64.gif)

## 🧱 Development

```bash
yarn start
```

Runs the extension in the development mode for Chrome target.<br>
It's recommended to use Chrome for developing.

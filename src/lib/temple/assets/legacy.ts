import { browser } from "webextension-polyfill-ts";

import { TempleAsset, TempleToken, TempleAssetType } from "lib/temple/types";

export const TEZ_ASSET: TempleAsset = {
  type: TempleAssetType.TEZ,
  name: "Tezos",
  symbol: "tez",
  decimals: 6,
  fungible: true,
  status: "displayed",
};

export const DELPHINET_TOKENS: TempleToken[] = [
  {
    type: TempleAssetType.FA1_2,
    address: "KT1RXpLtz22YgX24QQhxKVyKvtKZFaAVtTB9",
    name: "Kolibri",
    symbol: "kUSD",
    decimals: 18,
    fungible: true,
    iconUrl: "https://kolibri-data.s3.amazonaws.com/logo.png",
    status: "displayed",
  },
  {
    type: TempleAssetType.FA1_2,
    address: "KT1TDHL9ipKL8WW3TMPvutbLh9uZBdY9BU59",
    name: "Wrapped Tezos",
    symbol: "wXTZ",
    decimals: 6,
    fungible: true,
    iconUrl: browser.runtime.getURL("misc/token-logos/wxtz.png"),
    status: "displayed",
  },
  {
    type: TempleAssetType.FA2,
    address: "KT1WnjpKriR4yweiFdkTiMofoV9hvz7vMSXJ",
    id: 0,
    name: "Stably USD",
    symbol: "USDS",
    decimals: 6,
    fungible: true,
    iconUrl: browser.runtime.getURL("misc/token-logos/usds.svg"),
    status: "displayed",
  },
  {
    type: TempleAssetType.FA1_2,
    address: "KT19UypipJWENBavh34Wn7tc67bL1HucZh9W",
    name: "Staker Governance Token",
    symbol: "STKR",
    decimals: 18,
    fungible: true,
    iconUrl: "https://github.com/StakerDAO/resources/raw/main/stkr.png",
    status: "displayed",
  },
  {
    type: TempleAssetType.FA1_2,
    address: "KT1N3KopJkpzBfRPFVzqaAwyPEyuVmhpePmt",
    name: "Blend",
    symbol: "BLND",
    decimals: 18,
    fungible: true,
    iconUrl: "https://github.com/StakerDAO/resources/raw/main/blend.png",
    status: "displayed",
  },
];

export const MAINNET_TOKENS: TempleToken[] = [
  {
    type: TempleAssetType.TzBTC,
    address: "KT1PWx2mnDueood7fEmfbBDKx1D9BAnnXitn",
    name: "Tezos BTC",
    symbol: "tzBTC",
    decimals: 8,
    fungible: true,
    iconUrl:
      "https://tzbtc.io/wp-content/uploads/2020/03/tzbtc_logo_single.svg",
    status: "displayed",
  },
  {
    type: TempleAssetType.FA1_2,
    address: "KT1K9gCRgaLRFKTErYt1wVxA3Frb9FjasjTV",
    name: "Kolibri",
    symbol: "kUSD",
    decimals: 18,
    fungible: true,
    iconUrl: "https://kolibri-data.s3.amazonaws.com/logo.png",
    status: "displayed",
  },
  {
    type: TempleAssetType.FA1_2,
    address: "KT1AxaBxkFLCUi3f8rdDAAxBKHfzY8LfKDRA",
    name: "Quipuswap Liquidating kUSD",
    symbol: "QLkUSD",
    decimals: 36,
    fungible: true,
    iconUrl: "https://kolibri-data.s3.amazonaws.com/logo.png",
    status: "displayed",
  },
  {
    type: TempleAssetType.FA1_2,
    address: "KT1VYsVfmobT7rsMVivvZ4J8i3bPiqz12NaH",
    name: "Wrapped Tezos",
    symbol: "wXTZ",
    decimals: 6,
    fungible: true,
    iconUrl: browser.runtime.getURL("misc/token-logos/wxtz.png"),
    status: "displayed",
  },
  {
    type: TempleAssetType.FA2,
    address: "KT1REEb5VxWRjcHm5GzDMwErMmNFftsE5Gpf",
    id: 0,
    name: "Stably USD",
    symbol: "USDS",
    decimals: 6,
    fungible: true,
    iconUrl: browser.runtime.getURL("misc/token-logos/usds.svg"),
    status: "displayed",
  },
  {
    type: TempleAssetType.FA1_2,
    address: "KT19at7rQUvyjxnZ2fBv7D9zc8rkyG7gAoU8",
    name: "ETH Tez",
    symbol: "ETHtz",
    decimals: 18,
    fungible: true,
    iconUrl: browser.runtime.getURL("misc/token-logos/ethtz.png"),
    status: "hidden",
  },
  {
    type: TempleAssetType.FA1_2,
    address: "KT1LN4LPSqTMS7Sd2CJw4bbDGRkMv2t68Fy9",
    name: "USD Tez",
    symbol: "USDtz",
    decimals: 6,
    fungible: true,
    iconUrl: browser.runtime.getURL("misc/token-logos/usdtz.png"),
    status: "hidden",
  },
  {
    type: TempleAssetType.FA1_2,
    address: "KT1AEfeckNbdEYwaMKkytBwPJPycz7jdSGea",
    name: "Staker Governance Token",
    symbol: "STKR",
    decimals: 18,
    fungible: true,
    iconUrl: "https://github.com/StakerDAO/resources/raw/main/stkr.png",
    status: "hidden",
  },
  {
    type: TempleAssetType.FA1_2,
    address: "KT1MEouXPpCx9eFJYnxfAWpFA7NxhW3rDgUN",
    name: "Blend",
    symbol: "BLND",
    decimals: 18,
    fungible: true,
    iconUrl: "https://github.com/StakerDAO/resources/raw/main/blend.png",
    status: "hidden",
  },
];

export function mergeAssets<T extends TempleAsset>(base: T[], ...rest: T[][]) {
  const uniques = new Set<string>();
  return base.concat(...rest).filter((a) => {
    const key = getAssetKey(a);
    if (uniques.has(key)) return false;
    uniques.add(key);
    return true;
  });
}

export function omitAssets<T extends TempleAsset>(base: T[], toRemove: T[]) {
  const toRemoveSet = new Set(toRemove.map(getAssetKey));
  return base.filter((a) => !toRemoveSet.has(getAssetKey(a)));
}

export function assetsAreSame(aAsset: TempleAsset, bAsset: TempleAsset) {
  return getAssetKey(aAsset) === getAssetKey(bAsset);
}

export function getAssetKey(asset: TempleAsset) {
  switch (asset.type) {
    case TempleAssetType.TEZ:
      return "tez";

    case TempleAssetType.FA2:
      return `${asset.address}_${asset.id}`;

    default:
      return `${asset.address}_0`;
  }
}

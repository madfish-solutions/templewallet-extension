import * as React from "react";
import { BcdNetwork } from "lib/better-call-dev";
import {
  ThanosAccount,
  ThanosAsset,
  ThanosAssetType,
  ThanosAccountType,
  ThanosChainId,
} from "lib/thanos/types";
import { T, t } from "lib/i18n/react";
import xtzImgUrl from "app/misc/xtz.png";

export const BCD_NETWORKS_NAMES = new Map<ThanosChainId, BcdNetwork>([
  [ThanosChainId.Mainnet, "mainnet"],
  [ThanosChainId.Edonet, "edonet"],
  [ThanosChainId.Delphinet, "delphinet"],
]);

export class ArtificialError extends Error {}
export class NotEnoughFundsError extends ArtificialError {}
export class ZeroBalanceError extends NotEnoughFundsError {}
export class ZeroXTZBalanceError extends NotEnoughFundsError {}

export const PASSWORD_PATTERN = new RegExp(
  [
    "^",
    "(?=.*[a-z])", // Must contain at least 1 lowercase alphabetical character
    "(?=.*[A-Z])", // Must contain at least 1 uppercase alphabetical character
    "(?=.*[0-9])", // Must contain at least 1 numeric character
    "(?=.{8,})", // Must be eight characters or longer
  ].join("")
);

export const URL_PATTERN = /^((?:http(s)?:\/\/)?[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=.]+)|(http(s)?:\/\/localhost:[0-9]+)$/;

export const PASSWORD_ERROR_CAPTION = (
  <ul className="list-disc list-inside">
    <T id="atLeast8Characters">{(message) => <li>{message}</li>}</T>
    <T id="atLeast1Number">{(message) => <li>{message}</li>}</T>
    <T id="atLeast1LowercaseLetter">{(message) => <li>{message}</li>}</T>
    <T id="atLeast1UppercaseLetter">{(message) => <li>{message}</li>}</T>
  </ul>
);

export const MNEMONIC_ERROR_CAPTION = (
  <ul className="list-disc list-inside">
    <T id="mnemonicWordsAmountConstraint">{(message) => <li>{message}</li>}</T>
    <T id="mnemonicSpacingConstraint">{(message) => <li>{message}</li>}</T>
    <T id="justValidPreGeneratedMnemonic">{(message) => <li>{message}</li>}</T>
  </ul>
);

export function formatMnemonic(m: string) {
  return m.replace(/\n/g, " ").trim();
}

export function getAssetIconUrl(asset: ThanosAsset) {
  return asset.type === ThanosAssetType.XTZ ? xtzImgUrl : asset.iconUrl;
}

export function getAccountBadgeTitle(account: Pick<ThanosAccount, "type">) {
  switch (account.type) {
    case ThanosAccountType.Imported:
      return t("importedAccount");

    case ThanosAccountType.Ledger:
      return t("ledger");

    case ThanosAccountType.ManagedKT:
      return t("managedKTAccount");

    case ThanosAccountType.WatchOnly:
      return t("watchOnlyAccount");

    default:
      return null;
  }
}

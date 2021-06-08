import React from "react";

import tezImgUrl from "app/misc/tez.png";
import { T, t } from "lib/i18n/react";
import { sanitizeImgUri } from "lib/image-uri";
import {
  TempleAccount,
  TempleAsset,
  TempleAssetType,
  TempleAccountType,
} from "lib/temple/types";

export const ACTIVITY_PAGE_SIZE = 50;
export const OP_STACK_PREVIEW_SIZE = 2;

export class ArtificialError extends Error {}
export class NotEnoughFundsError extends ArtificialError {}
export class ZeroBalanceError extends NotEnoughFundsError {}
export class ZeroTEZBalanceError extends NotEnoughFundsError {}

export const PASSWORD_PATTERN = new RegExp(
  [
    "^",
    "(?=.*[a-z])", // Must contain at least 1 lowercase alphabetical character
    "(?=.*[A-Z])", // Must contain at least 1 uppercase alphabetical character
    "(?=.*[0-9])", // Must contain at least 1 numeric character
    "(?=.{8,})", // Must be eight characters or longer
  ].join("")
);

export const URL_PATTERN =
  /^((?:http(s)?:\/\/)?[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=.]+)|(http(s)?:\/\/localhost:[0-9]+)$/;

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

export function getAssetIconUrl(asset: TempleAsset) {
  const url = asset.type === TempleAssetType.TEZ ? tezImgUrl : asset.iconUrl;
  return url && sanitizeImgUri(url);
}

export function getAccountBadgeTitle(account: Pick<TempleAccount, "type">) {
  switch (account.type) {
    case TempleAccountType.Imported:
      return t("importedAccount");

    case TempleAccountType.Ledger:
      return t("ledger");

    case TempleAccountType.ManagedKT:
      return t("managedKTAccount");

    case TempleAccountType.WatchOnly:
      return t("watchOnlyAccount");

    default:
      return null;
  }
}

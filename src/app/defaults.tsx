import * as React from "react";
import { ThanosAsset, ThanosAssetType } from "lib/thanos/types";
import { T } from "lib/ui/i18n";
import xtzImgUrl from "app/misc/xtz.png";
import anyTokenImgUrl from "app/misc/anytoken.png";

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
  return asset.type === ThanosAssetType.XTZ
    ? xtzImgUrl
    : asset.iconUrl ?? anyTokenImgUrl;
}

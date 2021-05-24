import BigNumber from "bignumber.js";
import memoize from "micro-memoize";

import { getCurrentLocale, getNumberSymbols } from "./core";
import { t } from "./react";

type FormatParams = {
  decimalPlaces?: number;
  roundingMode?: BigNumber.RoundingMode;
  format?: BigNumber.Format;
};

function localizeDefaultFormattedNumber(formattedNumber: string) {
  const numberSymbols = getNumberSymbols();
  const pointIndex = formattedNumber.indexOf(".");
  if (pointIndex >= 0) {
    const integerPartStr = formattedNumber
      .substring(0, pointIndex)
      .replace(/,/g, numberSymbols.group);
    return `${integerPartStr}${
      numberSymbols.decimal
    }${formattedNumber.substring(pointIndex + 1)}`;
  }
  return formattedNumber.replace(/,/g, numberSymbols.group);
}

export function toLocalFormat(
  value: BigNumber.Value,
  { decimalPlaces, roundingMode, format }: FormatParams
) {
  const bn = new BigNumber(value);
  const numberSymbols = getNumberSymbols();

  if (!bn.isFinite()) {
    return bn.isNaN()
      ? numberSymbols.nan
      : `${bn.lt(0) ? "-" : ""}${numberSymbols.infinity}`;
  }

  let rawResult = "";
  if (decimalPlaces !== undefined && roundingMode !== undefined) {
    rawResult = bn.toFormat(decimalPlaces, roundingMode, format);
  } else if (decimalPlaces !== undefined && format) {
    rawResult = bn.toFormat(decimalPlaces, format);
  } else if (decimalPlaces !== undefined) {
    rawResult = bn.toFormat(decimalPlaces, roundingMode);
  } else if (format) {
    rawResult = bn.toFormat(format);
  } else {
    rawResult = bn.toFormat();
  }

  if (format === undefined) {
    return localizeDefaultFormattedNumber(rawResult);
  }
  return rawResult;
}

const makePluralRules = memoize(
  (locale: string) => new Intl.PluralRules(locale.replace("_", "-"))
);

export function getPluralKey(keyPrefix: string, amount: number) {
  const rules = makePluralRules(getCurrentLocale());
  return `${keyPrefix}_${rules.select(amount)}`;
}

export function toLocalFixed(
  value: BigNumber.Value,
  decimalPlaces?: number,
  roundingMode?: BigNumber.RoundingMode
) {
  const bn = new BigNumber(value);
  const numberSymbols = getNumberSymbols();

  if (!bn.isFinite()) {
    return bn.isNaN()
      ? numberSymbols.nan
      : `${bn.lt(0) ? "-" : ""}${numberSymbols.infinity}`;
  }

  const rawResult =
    decimalPlaces === undefined
      ? bn.toFixed()
      : bn.toFixed(decimalPlaces, roundingMode);

  return localizeDefaultFormattedNumber(rawResult);
}

export function toShortened(value: BigNumber.Value) {
  let bn = new BigNumber(value);
  if (bn.abs().lt(1)) {
    return toLocalFixed(bn.toPrecision(1));
  }
  bn = bn.integerValue();
  const formats = ["thousandFormat", "millionFormat", "billionFormat"];
  let formatIndex = -1;
  while (bn.abs().gte(1000) && formatIndex < formats.length - 1) {
    formatIndex++;
    bn = bn.div(1000);
  }
  bn = bn.decimalPlaces(1, BigNumber.ROUND_FLOOR);
  if (formatIndex === -1) {
    return toLocalFixed(bn);
  }
  return t(formats[formatIndex], toLocalFixed(bn));
}

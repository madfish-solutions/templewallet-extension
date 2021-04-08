import BigNumber from "bignumber.js";

import { getNumberSymbols } from "./core";

type FormatParams = {
  decimalPlaces?: number;
  roundingMode?: BigNumber.RoundingMode;
  format?: BigNumber.Format;
}

function localizeDefaultFormattedNumber(
  formattedNumber: string
) {
  const numberSymbols = getNumberSymbols();
  const pointIndex = formattedNumber.indexOf(".");
  if (pointIndex >= 0) {
    const integerPartStr = formattedNumber
      .substring(0, pointIndex)
      .replaceAll(",", numberSymbols.group);
    return `${integerPartStr}${numberSymbols.decimal}${formattedNumber.substring(pointIndex + 1)}`;
  }
  return formattedNumber.replaceAll(",", numberSymbols.group);
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
      : `${bn.lt(0) ? '-' : ''}${numberSymbols.infinity}`;
  }

  let rawResult = '';
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
      : `${bn.lt(0) ? '-' : ''}${numberSymbols.infinity}`;
  }

  const rawResult = decimalPlaces === undefined
    ? bn.toFixed()
    : bn.toFixed(decimalPlaces, roundingMode);
  
  return localizeDefaultFormattedNumber(rawResult);
}

import BigNumber from 'bignumber.js';
import memoizee from 'memoizee';

import { getCurrentLocale, getNumberSymbols } from './core';
import { t } from './react';
import { TID } from './types';

type FormatParams = {
  decimalPlaces?: number;
  roundingMode?: BigNumber.RoundingMode;
  format?: BigNumber.Format;
};

function localizeDefaultFormattedNumber(formattedNumber: string) {
  const numberSymbols = getNumberSymbols();
  const pointIndex = formattedNumber.indexOf('.');
  if (pointIndex >= 0) {
    const integerPartStr = formattedNumber.substring(0, pointIndex).replace(/,/g, numberSymbols.group);
    return `${integerPartStr}${numberSymbols.decimal}${formattedNumber.substring(pointIndex + 1)}`;
  }
  return formattedNumber.replace(/,/g, numberSymbols.group);
}

export function toLocalFormat(value: BigNumber.Value, { decimalPlaces, roundingMode, format }: FormatParams) {
  const bn = new BigNumber(value);
  const numberSymbols = getNumberSymbols();

  if (!bn.isFinite()) {
    const showMinus = bn.lt(0) ? '-' : '';
    return bn.isNaN() ? numberSymbols.nan : `${showMinus}${numberSymbols.infinity}`;
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

const makePluralRules = memoizee((locale: string) => new Intl.PluralRules(locale.replace('_', '-')));

export function getPluralKey<T extends string>(keyPrefix: T, amount: number) {
  return `${keyPrefix}_${getPluralKeyAmountPrefix(amount)}` as `${T}_${Intl.LDMLPluralRule}`;
}

function getPluralKeyAmountPrefix(amount: number) {
  const rules = makePluralRules(getCurrentLocale());
  return rules.select(amount);
}

export function toLocalFixed(value: BigNumber.Value, decimalPlaces?: number, roundingMode?: BigNumber.RoundingMode) {
  const bn = new BigNumber(value);
  const numberSymbols = getNumberSymbols();

  if (!bn.isFinite()) {
    const showMinus = bn.lt(0) ? '-' : '';
    return bn.isNaN() ? numberSymbols.nan : `${showMinus}${numberSymbols.infinity}`;
  }

  const rawResult = decimalPlaces === undefined ? bn.toFixed() : bn.toFixed(decimalPlaces, roundingMode);

  return localizeDefaultFormattedNumber(rawResult);
}

export function toShortened(value: BigNumber.Value) {
  let bn = new BigNumber(value);
  const target = bn.abs().decimalPlaces(2);

  if (target.lt(0.01)) return toLocalFixed(bn.toPrecision(2));

  if (target.lt(10_000)) return toLocalFixed(bn, 2);

  bn = bn.integerValue();

  const formats: TID[] = ['thousandFormat', 'millionFormat', 'billionFormat'];

  let formatIndex = -1;
  while (bn.abs().gte(1000) && formatIndex < formats.length - 1) {
    formatIndex++;
    bn = bn.div(1000);
  }

  if (formatIndex === -1) return toLocalFixed(bn, 2);

  return t(formats[formatIndex], toLocalFixed(bn, 0));
}

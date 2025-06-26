/**
 * Generic helpers used across the application
 */

import BigNumber from 'bignumber.js';

import { DEFAULT_TEZOS_DERIVATION_PATH } from 'lib/constants';

import * as FrontHelpers from '../front/helpers';
import * as Helpers from '../helpers';

describe('Helpers', () => {
  it('atomsToTokens', async () => {
    const atomsValue = new BigNumber(1_000_000_000_000);
    const realValue = Helpers.atomsToTokens(atomsValue, 9);
    expect(realValue.toFixed()).toBe('1000');
  });

  it('tokensToAtoms', async () => {
    const realValue = new BigNumber(1000);
    const atomsValue = Helpers.tokensToAtoms(realValue, 9);
    expect(atomsValue.toFixed()).toBe('1000000000000');
  });

  it('formatOpParamsBeforeSend', async () => {
    let params: any = { kind: 'transaction', script: {} };
    expect(Helpers.formatOpParamsBeforeSend(params)).toBe(params);

    params = { kind: 'origination' };
    expect(Helpers.formatOpParamsBeforeSend(params)).toBe(params);

    params = {
      kind: 'origination',
      script: { a: 'A' },
      storage: { b: 'B' }
    };
    expect(Helpers.formatOpParamsBeforeSend(params)).toStrictEqual({
      kind: 'origination',
      a: 'A',
      init: { b: 'B' }
    });

    params = {
      kind: 'transaction'
    };
    expect(Helpers.formatOpParamsBeforeSend(params, 'source')).toStrictEqual({
      kind: 'transaction',
      source: 'source'
    });
  });

  it('mutezToTz & tzToMutez', async () => {
    expect(Helpers.mutezToTz(1_000_000).toFixed()).toBe('1');
    expect(Helpers.tzToMutez(1).toFixed()).toBe('1000000');
  });

  it('usdToAssetAmount', async () => {
    const usd = new BigNumber(1);
    const assetUsdPrice = 5;
    const assetDecimals = 6;
    const value = Helpers.usdToAssetAmount(usd, assetUsdPrice, assetDecimals);
    expect(value?.toFixed()).toBe('0.2');
  });

  it('validateDerivationPath', async () => {
    expect(FrontHelpers.validateDerivationPath("44'/1729'/0'/0'")).toBe('Translated<derivationPathMustStartWithM>');
    expect(FrontHelpers.validateDerivationPath("m44'/1729'/0'/0'")).toBe('Translated<derivationSeparatorMustBeSlash>');
    expect(FrontHelpers.validateDerivationPath("m/44'/asd'/0'/0'")).toBe('Translated<invalidPath>');
    expect(FrontHelpers.validateDerivationPath(DEFAULT_TEZOS_DERIVATION_PATH)).toBeTruthy();
  });
});

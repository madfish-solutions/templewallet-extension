import { HttpResponseError } from '@taquito/http-utils';
import { ManagerKeyResponse, RpcClient } from '@taquito/rpc';
import { MichelCodecPacker } from '@taquito/taquito';
import { validateAddress, ValidationResult } from '@taquito/utils';
import BigNumber from 'bignumber.js';
import memoize from 'micro-memoize';

import { getMessage } from 'lib/i18n';
import { IntercomError } from 'lib/intercom/helpers';
import { FastRpcClient } from 'lib/taquito-fast-rpc';

export const loadFastRpcClient = memoize((rpc: string) => new FastRpcClient(rpc));

export const michelEncoder = new MichelCodecPacker();

export const loadChainId = memoize(fetchChainId, {
  isPromise: true,
  maxSize: 100
});

function fetchChainId(rpcUrl: string) {
  const rpc = new RpcClient(rpcUrl);
  return rpc.getChainId();
}

export function hasManager(manager: ManagerKeyResponse) {
  return manager && typeof manager === 'object' ? !!manager.key : !!manager;
}

export function usdToAssetAmount(
  usd?: BigNumber,
  assetUsdPrice?: number,
  assetDecimals?: number,
  roundingMode?: BigNumber.RoundingMode
) {
  return !usd || assetUsdPrice === undefined
    ? undefined
    : usd.div(assetUsdPrice).decimalPlaces(assetDecimals || 0, roundingMode ?? BigNumber.ROUND_DOWN);
}

export function tzToMutez(tz: any) {
  const bigNum = new BigNumber(tz);
  if (bigNum.isNaN()) return bigNum;
  return bigNum.times(10 ** 6).integerValue();
}

export function mutezToTz(mutez: any) {
  const bigNum = new BigNumber(mutez);
  if (bigNum.isNaN()) return bigNum;
  return bigNum.integerValue().div(10 ** 6);
}

export function atomsToTokens(x: BigNumber, decimals: number) {
  return x.integerValue().div(new BigNumber(10).pow(decimals));
}

export function tokensToAtoms(x: BigNumber, decimals: number) {
  return x.times(10 ** decimals).integerValue();
}

export function isAddressValid(address: string) {
  return validateAddress(address) === ValidationResult.VALID;
}

export function isKTAddress(address: string) {
  return address?.startsWith('KT');
}

export const isValidContractAddress = (address: string) => isAddressValid(address) && isKTAddress(address);

export function formatOpParamsBeforeSend(params: any) {
  if (params.kind === 'origination' && params.script) {
    const newParams = { ...params, ...params.script };
    newParams.init = newParams.storage;
    delete newParams.script;
    delete newParams.storage;
    return newParams;
  }
  return params;
}

export function transformHttpResponseError(err: HttpResponseError) {
  let parsedBody: any;
  try {
    parsedBody = JSON.parse(err.body);
  } catch {
    throw new Error(getMessage('unknownErrorFromRPC', err.url));
  }

  try {
    const firstTezError = parsedBody[0];

    let message: string;

    // Parse special error with Counter Already Used
    if (typeof firstTezError.msg === 'string' && /Counter.*already used for contract/.test(firstTezError.msg)) {
      message = getMessage('counterErrorDescription');
    } else {
      const matchingPostfix = Object.keys(KNOWN_TEZ_ERRORS).find(idPostfix => firstTezError?.id?.endsWith(idPostfix));
      message = matchingPostfix ? KNOWN_TEZ_ERRORS[matchingPostfix] : err.message;
    }

    return new IntercomError(message, parsedBody);
  } catch {
    throw err;
  }
}

const KNOWN_TEZ_ERRORS: Record<string, string> = {
  'implicit.empty_implicit_contract': getMessage('emptyImplicitContract'),
  'contract.balance_too_low': getMessage('balanceTooLow')
};

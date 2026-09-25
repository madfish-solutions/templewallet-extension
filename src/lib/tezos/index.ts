import { HttpRequestFailed, HttpResponseError } from '@taquito/http-utils';
import {
  InternalOperationResult,
  OpKind,
  OperationContents,
  type ManagerKeyResponse,
  type OperationContentsAndResult,
  type TezosGenericOperationError
} from '@taquito/rpc';
import { validateAddress, validateChain, ValidationResult } from '@taquito/utils';
import BigNumber from 'bignumber.js';
import { isObject } from 'lodash';

import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { ZERO } from 'lib/utils/numbers';
import { AssetsAmounts } from 'temple/types';

import { parseTransactionParams } from './parse-transaction-params';

export function isValidTezosChainId(chainId: string) {
  return validateChain(chainId) === ValidationResult.VALID;
}

export function isValidTezosAddress(address: string) {
  return validateAddress(address) === ValidationResult.VALID;
}

export function isTezosContractAddress(address: string) {
  return address.startsWith('KT');
}

export function isValidTezosImplicitAddress(address: string) {
  return !isTezosContractAddress(address) && isValidTezosAddress(address);
}

export function isValidTezosContractAddress(address: string) {
  return isTezosContractAddress(address) && isValidTezosAddress(address);
}

export function isTezosGenericOperationErrorArray(body: unknown): body is TezosGenericOperationError[] {
  return (
    Array.isArray(body) &&
    body.length > 0 &&
    body.every(
      item =>
        isObject(item) && 'kind' in item && 'id' in item && typeof item.kind === 'string' && typeof item.id === 'string'
    )
  );
}

export function parseJsonBody(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch {
    return undefined;
  }
}

export function isTransientTezosRpcError(error: unknown): boolean {
  if (error instanceof HttpRequestFailed) return true;

  if (!(error instanceof HttpResponseError) || Number(error.status) < 500) return false;

  const body = parseJsonBody(error.body);

  return !isTezosGenericOperationErrorArray(body) || body.every(err => !err.id.startsWith('proto.'));
}

export function tezosManagerKeyHasManager(manager: ManagerKeyResponse) {
  return manager && typeof manager === 'object' ? !!manager.key : !!manager;
}

const onBalanceChangeFnFactory =
  (balancesChanges: AssetsAmounts) => (tokenSlug: string, value: BigNumber, isNft: boolean | undefined) => {
    if (!balancesChanges[tokenSlug]) {
      balancesChanges[tokenSlug] = { atomicAmount: ZERO, isNft };
    }
    balancesChanges[tokenSlug].atomicAmount = balancesChanges[tokenSlug].atomicAmount.plus(value);
  };

function getBalancesChangesInternal(
  input: InternalOperationResult,
  externalOperationSource: string,
  externalOperationDestination: string
) {
  const balancesChanges: AssetsAmounts = {};
  const onBalanceChange = onBalanceChangeFnFactory(balancesChanges);

  if (input.kind !== OpKind.TRANSACTION) {
    const rawSpentMutez = input.amount ?? input.balance;

    return rawSpentMutez
      ? { [TEZ_TOKEN_SLUG]: { atomicAmount: new BigNumber(rawSpentMutez).negated(), isNft: false } }
      : {};
  }

  if (input.parameters) {
    parseTransactionParams(
      input.parameters,
      externalOperationSource,
      input.source,
      input.destination ?? externalOperationDestination,
      new BigNumber(input.amount ?? 0),
      onBalanceChange
    );
  }

  if (input.amount && input.destination === externalOperationSource) {
    onBalanceChange(TEZ_TOKEN_SLUG, new BigNumber(input.amount), false);
  }

  return balancesChanges;
}

export function getBalancesChanges(
  entry: OperationContentsAndResult | OperationContents,
  senderPkh: string
): AssetsAmounts;
export function getBalancesChanges(
  entries: OperationContentsAndResult[] | OperationContents[],
  senderPkh: string
): AssetsAmounts;
export function getBalancesChanges(
  input: OperationContentsAndResult | OperationContents | OperationContentsAndResult[] | OperationContents[],
  senderPkh: string
) {
  const balancesChanges: AssetsAmounts = {};
  const onBalanceChange = onBalanceChangeFnFactory(balancesChanges);
  const onBalancesChanges = (newBalancesChanges: AssetsAmounts) => {
    Object.entries(newBalancesChanges).forEach(([tokenSlug, { atomicAmount, isNft }]) =>
      onBalanceChange(tokenSlug, atomicAmount, isNft)
    );
  };

  if (Array.isArray(input)) {
    input.forEach(entry => {
      onBalancesChanges(getBalancesChanges(entry, senderPkh));
    });

    return balancesChanges;
  }

  if (input.kind !== OpKind.TRANSACTION) {
    const rawSpentMutez = 'amount' in input ? input.amount : 'balance' in input ? input.balance : undefined;

    return rawSpentMutez
      ? { [TEZ_TOKEN_SLUG]: { atomicAmount: new BigNumber(rawSpentMutez).negated(), isNft: false } }
      : {};
  }

  if (input.parameters) {
    parseTransactionParams(
      input.parameters,
      senderPkh,
      input.source,
      input.destination,
      new BigNumber(input.amount),
      onBalanceChange
    );
  }

  if ('metadata' in input) {
    input.metadata.internal_operation_results?.forEach(internalOpResult => {
      onBalancesChanges(getBalancesChangesInternal(internalOpResult, senderPkh, input.destination));
    });
  }
  if (
    input.amount &&
    input.source === senderPkh &&
    (input.destination !== senderPkh || input.parameters?.entrypoint === 'stake')
  ) {
    onBalanceChange(TEZ_TOKEN_SLUG, new BigNumber(input.amount).negated(), false);
  } else if (input.amount && input.source !== senderPkh && input.destination === senderPkh) {
    onBalanceChange(TEZ_TOKEN_SLUG, new BigNumber(input.amount), false);
  }

  return balancesChanges;
}

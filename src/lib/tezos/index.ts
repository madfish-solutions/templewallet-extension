import {
  InternalOperationResult,
  OpKind,
  OperationContents,
  type ManagerKeyResponse,
  type OperationContentsAndResult
} from '@taquito/rpc';
import { validateAddress, validateChain, ValidationResult } from '@taquito/utils';
import BigNumber from 'bignumber.js';

import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { ZERO } from 'lib/utils/numbers';

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

export function isValidTezosContractAddress(address: string) {
  return isTezosContractAddress(address) && isValidTezosAddress(address);
}

export function tezosManagerKeyHasManager(manager: ManagerKeyResponse) {
  return manager && typeof manager === 'object' ? !!manager.key : !!manager;
}

function getBalanceDeltasInternal(
  input: InternalOperationResult,
  externalOperationSource: string,
  externalOperationDestination: string
) {
  const balancesChanges: StringRecord<BigNumber> = {};
  const onBalanceChange = (tokenSlug: string, value: BigNumber) => {
    balancesChanges[tokenSlug] = (balancesChanges[tokenSlug] ?? ZERO).plus(value);
  };

  if (input.kind !== OpKind.TRANSACTION) {
    return input.amount ? { [TEZ_TOKEN_SLUG]: new BigNumber(input.amount).negated() } : {};
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
    onBalanceChange(TEZ_TOKEN_SLUG, new BigNumber(input.amount));
  }

  return balancesChanges;
}

export function getBalanceDeltas(
  entry: OperationContentsAndResult | OperationContents,
  senderPkh: string
): StringRecord<BigNumber>;
export function getBalanceDeltas(
  entries: OperationContentsAndResult[] | OperationContents[],
  senderPkh: string
): StringRecord<BigNumber>;
export function getBalanceDeltas(
  input: OperationContentsAndResult | OperationContents | OperationContentsAndResult[] | OperationContents[],
  senderPkh: string
) {
  const balancesChanges: StringRecord<BigNumber> = {};
  const onBalanceChange = (tokenSlug: string, value: BigNumber) => {
    balancesChanges[tokenSlug] = (balancesChanges[tokenSlug] ?? ZERO).plus(value);
  };

  if (Array.isArray(input)) {
    input.forEach(entry => {
      const internalBalancesChanges = getBalanceDeltas(entry, senderPkh);
      Object.entries(internalBalancesChanges).forEach(
        ([tokenSlug, value]) => value && onBalanceChange(tokenSlug, value)
      );
    });

    return balancesChanges;
  }

  if (input.kind !== OpKind.TRANSACTION) {
    return 'amount' in input ? { [TEZ_TOKEN_SLUG]: new BigNumber(input.amount) } : {};
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
      const internalBalancesChanges = getBalanceDeltasInternal(internalOpResult, senderPkh, input.destination);
      Object.entries(internalBalancesChanges).forEach(
        ([tokenSlug, value]) => value && onBalanceChange(tokenSlug, value)
      );
    });
  }
  if (
    input.amount &&
    input.source === senderPkh &&
    (input.destination !== senderPkh || input.parameters?.entrypoint === 'stake')
  ) {
    onBalanceChange(TEZ_TOKEN_SLUG, new BigNumber(input.amount).negated());
  }

  return balancesChanges;
}

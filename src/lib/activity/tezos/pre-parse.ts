import { TzktOperation, TzktTransactionOperation } from 'lib/apis/tzkt';
import {
  isTzktOperParam,
  isTzktOperParam_Fa12,
  isTzktOperParam_Fa2,
  isTzktOperParam_LiquidityBaking,
  ParameterFa2
} from 'lib/apis/tzkt/utils';
import { isTruthy } from 'lib/utils';
import { ZERO } from 'lib/utils/numbers';

import { OperationMember } from '../types';

import { TempleTzktOperationsGroup } from './types';
import type {
  TezosPreActivityStatus,
  TezosPreActivity,
  TezosPreActivityOperationBase,
  TezosPreActivityTransactionOperation,
  TezosPreActivityOtherOperation,
  TezosPreActivityOperation
} from './types';

export function preparseTezosOperationsGroup(
  { hash, operations }: TempleTzktOperationsGroup,
  address: string
): TezosPreActivity {
  const firstOperation = operations[0]!;
  const oldestTzktOperation = operations[operations.length - 1]!;
  const addedAt = firstOperation.timestamp;
  const activityOperations = reduceTzktOperations(operations, address);
  const status = deriveActivityStatus(activityOperations);

  return {
    hash,
    addedAt,
    status,
    operations: activityOperations,
    oldestTzktOperation
  };
}

function reduceTzktOperations(operations: TzktOperation[], address: string): TezosPreActivityOperation[] {
  const reducedOperations = operations.map(op => reduceOneTzktOperation(op, address)).filter(isTruthy);

  return reducedOperations;
}

/**
 * (i) Does not mutate operation object
 */
function reduceOneTzktOperation(operation: TzktOperation, address: string): TezosPreActivityOperation | null {
  switch (operation.type) {
    case 'transaction':
      return reduceOneTzktTransactionOperation(address, operation);
    case 'delegation': {
      if (operation.sender.address !== address) return null;

      const activityOperBase = buildActivityOperBase(operation, '0', operation.sender.address === address);
      const activityOper: TezosPreActivityOtherOperation = {
        ...activityOperBase,
        source: operation.sender,
        type: 'delegation'
      };
      if (operation.newDelegate) activityOper.destination = operation.newDelegate;
      return activityOper;
    }
    case 'origination': {
      const amount = operation.contractBalance ? operation.contractBalance.toString() : '0';
      const activityOperBase = buildActivityOperBase(operation, amount, operation.sender.address === address);
      const activityOper: TezosPreActivityOtherOperation = {
        ...activityOperBase,
        source: operation.sender,
        type: 'origination'
      };
      if (operation.originatedContract) activityOper.destination = operation.originatedContract;
      return activityOper;
    }
    default:
      return null;
  }
}

function reduceOneTzktTransactionOperation(
  address: string,
  operation: TzktTransactionOperation
): TezosPreActivityTransactionOperation | null {
  function _buildReturn(args: {
    amount: string;
    from: OperationMember;
    to?: OperationMember;
    contractAddress?: string;
    tokenId?: string;
  }) {
    const { amount, from, to, contractAddress, tokenId } = args;
    const activityOperBase = buildActivityOperBase(operation, amount, from.address === address);
    const activityOper: TezosPreActivityTransactionOperation = {
      ...activityOperBase,
      type: 'transaction',
      destination: operation.target,
      from,
      to
    };

    if (contractAddress != null) activityOper.contractAddress = contractAddress;
    if (tokenId != null) activityOper.tokenId = tokenId;
    if (isTzktOperParam(operation.parameter)) activityOper.entrypoint = operation.parameter.entrypoint;

    return activityOper;
  }

  const parameter = operation.parameter;

  if (parameter == null) {
    if (operation.target.address !== address && operation.sender.address !== address) return null;

    const from = operation.sender;
    const to = operation.target;
    const amount = String(operation.amount);

    return _buildReturn({ amount, from, to });
  } else if (isTzktOperParam_Fa2(parameter)) {
    const values = reduceParameterFa2Values(parameter.value, address);
    const firstVal = values[0];
    // (!) Here we abandon other but 1st non-zero-amount values
    if (firstVal == null) return null;

    const contractAddress = operation.target.address;
    const amount = firstVal.amount;
    const tokenId = firstVal.tokenId;
    const from = { ...operation.sender, address: firstVal.fromAddress };
    const to = firstVal.isToRelAddress ? { address } : undefined;

    return _buildReturn({ amount, from, to, contractAddress, tokenId });
  } else if (isTzktOperParam_Fa12(parameter)) {
    if (parameter.entrypoint === 'approve') return null; // TODO: Implement

    const from = { ...operation.sender };
    if (parameter.value.from === address) from.address = address;
    else if (parameter.value.to === address) from.address = parameter.value.from;
    else return null;

    const contractAddress = operation.target.address;
    const amount = parameter.value.value;
    const to = operation.target;

    return _buildReturn({ amount, from, to, contractAddress });
  } else if (isTzktOperParam_LiquidityBaking(parameter)) {
    const from = operation.sender;
    const to = operation.target;
    const contractAddress = operation.target.address;
    const amount = parameter.value.quantity;

    return _buildReturn({ amount, from, to, contractAddress });
  } else {
    const from = operation.sender;
    const to = operation.target;
    const amount = String(operation.amount);

    return _buildReturn({ amount, from, to });
  }
}

function buildActivityOperBase(operation: TzktOperation, amount: string, from: boolean) {
  const { id, level, timestamp: addedAt } = operation;
  const reducedOperation: TezosPreActivityOperationBase = {
    id,
    level,
    amountSigned: from ? `-${amount}` : amount,
    status: stringToActivityStatus(operation.status),
    addedAt
  };

  return reducedOperation;
}

interface ReducedParameterFa2Values {
  fromAddress: string;
  isToRelAddress?: boolean;
  amount: string;
  tokenId: string;
}

/**
 * Items with zero cumulative amount value are filtered out
 */
function reduceParameterFa2Values(values: ParameterFa2['value'], relAddress: string) {
  const result: ReducedParameterFa2Values[] = [];

  for (const val of values) {
    /*
      We assume, that all `val.txs` items have same `token_id` value.
      Visit https://tezos.b9lab.com/fa2 - There is a link to code in Smartpy IDE.
      Fa2 token-standard/smartcontract literally has it in its code.
    */
    const tokenId = val.txs[0]!.token_id;

    const fromAddress = val.from_;

    if (fromAddress === relAddress) {
      const amount = val.txs.reduce((acc, tx) => acc.plus(tx.amount), ZERO);

      if (amount.isZero()) continue;

      result.push({
        fromAddress,
        amount: amount.toFixed(),
        tokenId
      });

      continue;
    }

    const amount = val.txs.reduce((acc, tx) => (tx.to_ === relAddress ? acc.plus(tx.amount) : acc), ZERO);

    if (amount.isZero() === false)
      result.push({
        fromAddress,
        isToRelAddress: true,
        amount: amount.toFixed(),
        tokenId
      });
  }

  return result;
}

function stringToActivityStatus(status: string): TezosPreActivityStatus {
  if (['applied', 'backtracked', 'skipped', 'failed'].includes(status)) return status as TezosPreActivityStatus;

  return 'pending';
}

function deriveActivityStatus(items: { status: TezosPreActivityStatus }[]): TezosPreActivityStatus {
  if (items.find(o => o.status === 'pending')) return 'pending';
  if (items.find(o => o.status === 'applied')) return 'applied';
  if (items.find(o => o.status === 'backtracked')) return 'backtracked';
  if (items.find(o => o.status === 'skipped')) return 'skipped';
  if (items.find(o => o.status === 'failed')) return 'failed';

  return items[0]!.status;
}

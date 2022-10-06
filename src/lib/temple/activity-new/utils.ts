import { BigNumber } from 'bignumber.js';

import { TzktOperation, TzktTransactionOperation } from 'lib/tzkt';
import {
  isTzktOperParam,
  isTzktOperParam_Fa12,
  isTzktOperParam_Fa2,
  isTzktOperParam_LiquidityBaking,
  ParameterFa2
} from 'lib/tzkt/utils';

import type {
  OperationsGroup,
  ActivityStatus,
  Activity,
  ActivityOperationBase,
  ActivityTransactionOperation,
  ActivityOtherOperation,
  ActivityOperation,
  ActivityMember
} from './types';

export function operationsGroupToActivity({ hash, operations }: OperationsGroup, address: string): Activity {
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

function reduceTzktOperations(operations: TzktOperation[], address: string): ActivityOperation[] {
  const reducedOperations = operations
    .map(op => reduceOneTzktOperation(op, address))
    .filter(Boolean) as ActivityOperation[];

  return reducedOperations;
}

/**
 * (i) Does not mutate operation object
 */
function reduceOneTzktOperation(operation: TzktOperation, address: string): ActivityOperation | null {
  switch (operation.type) {
    case 'transaction':
      return reduceOneTzktTransactionOperation(address, operation);
    case 'delegation': {
      if (operation.sender.address !== address) return null;

      const activityOperBase = buildActivityOperBase(operation, address, '0', operation.sender);
      const activityOper: ActivityOtherOperation = {
        ...activityOperBase,
        type: 'delegation'
      };
      if (operation.newDelegate) activityOper.destination = operation.newDelegate;
      return activityOper;
    }
    case 'origination': {
      const source = operation.sender;
      const amount = operation.contractBalance ? operation.contractBalance.toString() : '0';
      const activityOperBase = buildActivityOperBase(operation, address, amount, source);
      const activityOper: ActivityOtherOperation = {
        ...activityOperBase,
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
): ActivityTransactionOperation | null {
  function _buildReturn(args: { amount: string; source: ActivityMember; contractAddress?: string; tokenId?: string }) {
    const { amount, source, contractAddress, tokenId } = args;
    const activityOperBase = buildActivityOperBase(operation, address, amount, source);
    const activityOper: ActivityTransactionOperation = {
      ...activityOperBase,
      type: 'transaction',
      destination: operation.target
    };
    if (contractAddress != null) activityOper.contractAddress = contractAddress;
    if (tokenId != null) activityOper.tokenId = tokenId;
    if (isTzktOperParam(operation.parameter)) activityOper.entrypoint = operation.parameter.entrypoint;
    return activityOper;
  }

  const parameter = operation.parameter;

  if (parameter == null) {
    if (operation.target.address !== address && operation.sender.address !== address) return null;

    const source = operation.sender;
    const amount = String(operation.amount);

    return _buildReturn({ amount, source });
  } else if (isTzktOperParam_Fa2(parameter)) {
    const values = reduceParameterFa2Values(parameter.value, address);
    const firstVal = values[0];
    // (!) Here we abandon other but 1st non-zero-amount values
    if (firstVal == null) return null;

    const contractAddress = operation.target.address;
    const amount = firstVal.amount;
    const tokenId = firstVal.tokenId;
    const source = firstVal.from === address ? { ...operation.sender, address } : operation.sender;

    return _buildReturn({ amount, source, contractAddress, tokenId });
  } else if (isTzktOperParam_Fa12(parameter)) {
    if (parameter.entrypoint === 'approve') return null;

    const source = { ...operation.sender };
    if (parameter.value.from === address) source.address = address;
    else if (parameter.value.to === address) source.address = parameter.value.from;
    else return null;

    const contractAddress = operation.target.address;
    const amount = parameter.value.value;

    return _buildReturn({ amount, source, contractAddress });
  } else if (isTzktOperParam_LiquidityBaking(parameter)) {
    const source = operation.sender;
    const contractAddress = operation.target.address;
    const amount = parameter.value.quantity;

    return _buildReturn({ amount, source, contractAddress });
  } else {
    const source = operation.sender;
    const amount = String(operation.amount);

    return _buildReturn({ amount, source });
  }
}

function buildActivityOperBase(operation: TzktOperation, address: string, amount: string, source: ActivityMember) {
  const { id, hash, level } = operation;
  const reducedOperation: ActivityOperationBase = {
    id,
    hash,
    level,
    source,
    amountSigned: source.address === address ? `-${amount}` : amount,
    status: stringToActivityStatus(operation.status),
    addedAt: operation.timestamp,
    timestamp: new Date(operation.timestamp).getTime()
  };
  return reducedOperation;
}

/**
 * Items with zero cumulative amount value are filtered out
 */
function reduceParameterFa2Values(values: ParameterFa2['value'], relAddress: string) {
  const result: {
    from: string;
    amount: string;
    tokenId: string;
  }[] = [];

  for (const val of values) {
    /*
      We assume, that all `val.txs` items have same `token_id` value.
      Visit https://tezos.b9lab.com/fa2 - There is a link to code in Smartpy IDE.
      Fa2 token-standard/smartcontract literally has it in its code.
    */

    const from = val.from_;
    if (val.from_ === relAddress) {
      const amount = val.txs.reduce((acc, tx) => acc.plus(tx.amount), new BigNumber(0));
      if (amount.isZero()) continue;
      result.push({
        from,
        amount: amount.toFixed(),
        tokenId: val.txs[0]!.token_id
      });
      continue;
    }
    let isValRel = false;
    let amount = new BigNumber(0);
    for (const tx of val.txs) {
      if (tx.to_ === relAddress) {
        amount = amount.plus(tx.amount);
        if (isValRel === false) isValRel = true;
      }
    }
    if (isValRel && amount.isZero() === false)
      result.push({
        from,
        amount: amount.toFixed(),
        tokenId: val.txs[0]!.token_id
      });
  }

  return result;
}

function stringToActivityStatus(status: string): ActivityStatus {
  if (['applied', 'backtracked', 'skipped', 'failed'].includes(status)) return status as ActivityStatus;

  return 'pending';
}

function deriveActivityStatus(items: { status: ActivityStatus }[]): ActivityStatus {
  if (items.find(o => o.status === 'pending')) return 'pending';
  if (items.find(o => o.status === 'applied')) return 'applied';
  if (items.find(o => o.status === 'backtracked')) return 'backtracked';
  if (items.find(o => o.status === 'skipped')) return 'skipped';
  if (items.find(o => o.status === 'failed')) return 'failed';

  return items[0]!.status;
}

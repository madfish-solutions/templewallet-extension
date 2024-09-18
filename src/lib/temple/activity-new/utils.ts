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
  const reducedOperations = operations.map(op => reduceOneTzktOperation(op, address)).filter(isTruthy);

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
      if (operation.newDelegate) activityOper.target = operation.newDelegate;
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
      if (operation.originatedContract) activityOper.target = operation.originatedContract;
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
  function _buildReturn(args: {
    amount: string;
    from: ActivityMember;
    to?: ActivityMember;
    source?: ActivityMember;
    contractAddress?: string;
    tokenId?: string;
  }) {
    const { amount, from, to = operation.target, source = operation.sender, contractAddress, tokenId } = args;
    const activityOperBase = buildActivityOperBase(operation, address, amount, source);
    const activityOper: ActivityTransactionOperation = {
      ...activityOperBase,
      type: 'transaction',
      target: operation.target,
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
    const amount = String(operation.amount);

    return _buildReturn({ amount, from });
  } else if (isTzktOperParam_Fa2(parameter)) {
    const values = reduceParameterFa2Values(parameter.value, address);
    const firstVal = values[0];
    // (!) Here we abandon other but 1st non-zero-amount values
    if (firstVal == null) return null;

    const contractAddress = operation.target.address;
    const amount = firstVal.amount;
    const tokenId = firstVal.tokenId;
    const from = firstVal.from === address ? { ...operation.sender, address } : operation.sender;
    const to = firstVal.toRelAddress ? { address } : operation.target;

    return _buildReturn({ amount, from, to, source: from, contractAddress, tokenId });
  } else if (isTzktOperParam_Fa12(parameter)) {
    if (parameter.entrypoint === 'approve') return null;

    const from = { ...operation.sender };
    if (parameter.value.from === address) from.address = address;
    else if (parameter.value.to === address) from.address = parameter.value.from;
    else return null;

    const contractAddress = operation.target.address;
    const amount = parameter.value.value;

    return _buildReturn({ amount, from, source: from, contractAddress });
  } else if (isTzktOperParam_LiquidityBaking(parameter)) {
    const from = operation.sender;
    const contractAddress = operation.target.address;
    const amount = parameter.value.quantity;

    return _buildReturn({ amount, from, contractAddress });
  } else {
    const from = operation.sender;
    const amount = String(operation.amount);

    return _buildReturn({ amount, from });
  }
}

function buildActivityOperBase(operation: TzktOperation, address: string, amount: string, source: ActivityMember) {
  const { id, level, timestamp: addedAt } = operation;
  const reducedOperation: ActivityOperationBase = {
    id,
    level,
    source,
    amountSigned: source.address === address ? `-${amount}` : amount,
    status: stringToActivityStatus(operation.status),
    addedAt
  };
  return reducedOperation;
}

/**
 * Items with zero cumulative amount value are filtered out
 */
function reduceParameterFa2Values(values: ParameterFa2['value'], relAddress: string) {
  const result: {
    from: string;
    toRelAddress?: boolean;
    amount: string;
    tokenId: string;
  }[] = [];

  for (const val of values) {
    /*
      We assume, that all `val.txs` items have same `token_id` value.
      Visit https://tezos.b9lab.com/fa2 - There is a link to code in Smartpy IDE.
      Fa2 token-standard/smartcontract literally has it in its code.
    */
    const tokenId = val.txs[0]!.token_id;

    const from = val.from_;

    if (val.from_ === relAddress) {
      const amount = val.txs.reduce((acc, tx) => acc.plus(tx.amount), ZERO);

      if (amount.isZero()) continue;

      result.push({
        from,
        amount: amount.toFixed(),
        tokenId
      });

      continue;
    }

    const amount = val.txs.reduce((acc, tx) => (tx.to_ === relAddress ? acc.plus(tx.amount) : acc), ZERO);

    if (amount.isZero() === false)
      result.push({
        from,
        toRelAddress: true,
        amount: amount.toFixed(),
        tokenId
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

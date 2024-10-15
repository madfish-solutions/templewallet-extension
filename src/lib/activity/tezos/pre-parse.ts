import { TzktOperation, TzktTransactionOperation } from 'lib/apis/tzkt';
import {
  isTzktOperParam,
  isTzktOperParam_Fa12,
  isTzktOperParam_Fa2_approve,
  isTzktOperParam_Fa2_transfer,
  isTzktOperParam_LiquidityBaking,
  ParameterFa2Transfer
} from 'lib/apis/tzkt/utils';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
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
  { hash, operations: groupOperations }: TempleTzktOperationsGroup,
  address: string,
  chainId: string
): TezosPreActivity {
  const lastOperation = groupOperations[groupOperations.length - 1]!;
  const addedAt = lastOperation.timestamp;
  const operations = groupOperations.map(op => reduceOneTzktOperation(op, address)).filter(isTruthy);
  const status = deriveActivityStatus(operations);

  return {
    hash,
    addedAt,
    status,
    operations,
    oldestTzktOperation: lastOperation,
    chainId
  };
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
        sender: operation.sender,
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
        sender: operation.sender,
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
    to: OperationMember | string[];
    contract?: string;
    tokenId?: string;
    subtype?: TezosPreActivityTransactionOperation['subtype'];
  }) {
    const { amount, from, to, contract, tokenId, subtype } = args;

    const activityOperBase = buildActivityOperBase(
      operation,
      amount,
      subtype === 'approve' ? false : from.address === address
    );

    const activityOper: TezosPreActivityTransactionOperation = {
      ...activityOperBase,
      type: 'transaction',
      subtype,
      destination: operation.target,
      from,
      to: Array.isArray(to) ? to.map(address => ({ address })) : [to],
      contract,
      tokenId
    };

    if (isTzktOperParam(operation.parameter)) activityOper.entrypoint = operation.parameter.entrypoint;

    return activityOper;
  }

  const parameter = operation.parameter;

  if (parameter == null) {
    if (operation.target.address !== address && operation.sender.address !== address) return null;

    const from = operation.sender;
    const to = operation.target;
    const amount = String(operation.amount);
    const contract = TEZ_TOKEN_SLUG;

    return _buildReturn({ amount, from, to, contract, subtype: 'transfer' });
  } else if (isTzktOperParam_Fa2_transfer(parameter)) {
    const values = reduceParameterFa2TransferValues(parameter.value, address);
    const firstVal = values.at(0);
    // (!) Here we abandon other but 1st non-zero-amount values
    if (firstVal == null) return null;

    const contract = operation.target.address;
    const amount = firstVal.amount;
    const tokenId = firstVal.tokenId;
    const from = { ...operation.sender, address: firstVal.fromAddress };
    const to = firstVal.toAddresses;

    return _buildReturn({ amount, from, to, contract, tokenId, subtype: 'transfer' });
  } else if (isTzktOperParam_Fa2_approve(parameter)) {
    const add_operator = parameter.value[0].add_operator;

    const from = operation.sender;
    const to = { address: add_operator.operator };
    const amount = String(operation.amount);
    const contract = operation.target.address;
    const tokenId = add_operator.token_id;

    return _buildReturn({
      amount,
      from,
      to,
      subtype: 'approve',
      contract,
      tokenId
    });
  } else if (isTzktOperParam_Fa12(parameter)) {
    const amount = parameter.value.value;
    const contract = operation.target.address;

    if (parameter.entrypoint === 'approve') {
      if (amount === '0') return null;

      const from = operation.sender;
      const to = { address: parameter.value.spender };

      return _buildReturn({ amount, from, to, contract, subtype: 'approve' });
    }

    const from = { ...operation.sender, address: parameter.value.from };
    const to = { address: parameter.value.to };

    return _buildReturn({ amount, from, to, contract, subtype: 'transfer' });
  } else if (isTzktOperParam_LiquidityBaking(parameter)) {
    const from = operation.sender;
    const to = operation.target;
    const contract = operation.target.address;
    const amount = parameter.value.quantity;

    return _buildReturn({ amount, from, to, contract, subtype: 'transfer' });
  } else {
    const from = operation.sender;
    const to = operation.target;
    const amount = String(operation.amount);

    return _buildReturn({ amount, from, to });
  }
}

function buildActivityOperBase(operation: TzktOperation, amount: string, from: boolean) {
  const { id, level, sender, timestamp: addedAt } = operation;
  const reducedOperation: TezosPreActivityOperationBase = {
    id,
    level,
    sender,
    amountSigned: from ? `-${amount}` : amount,
    status: stringToActivityStatus(operation.status),
    addedAt
  };

  return reducedOperation;
}

interface ReducedParameterFa2Values {
  fromAddress: string;
  toAddresses: string[];
  amount: string;
  tokenId: string;
}

/**
 * Items with zero cumulative amount value are filtered out
 */
function reduceParameterFa2TransferValues(values: ParameterFa2Transfer['value'], relAddress: string) {
  const result: ReducedParameterFa2Values[] = [];

  for (const val of values) {
    const firstTx = val.txs.at(0);
    if (firstTx == null) continue;

    /*
      We assume, that all `val.txs` items have same `token_id` value.
      Visit https://tezos.b9lab.com/fa2 - There is a link to code in Smartpy IDE.
      Fa2 token-standard/smartcontract literally has it in its code.
    */
    const tokenId = firstTx.token_id;

    const fromAddress = val.from_;

    if (fromAddress === relAddress) {
      let amount = ZERO;
      const toAddresses = val.txs.map(tx => {
        amount = amount.plus(tx.amount);

        return tx.to_;
      });

      if (amount.isZero()) continue;

      result.push({
        fromAddress,
        toAddresses,
        amount: amount.toFixed(),
        tokenId
      });

      continue;
    }

    const amount = val.txs.reduce((acc, tx) => (tx.to_ === relAddress ? acc.plus(tx.amount) : acc), ZERO);

    if (amount.isZero() === false)
      result.push({
        fromAddress,
        toAddresses: [relAddress], // Not interested in all the other `tx.to_`s at the moment
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

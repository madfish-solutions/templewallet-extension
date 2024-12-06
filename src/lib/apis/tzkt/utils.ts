import { TzktAccount } from './types';

export const calcTzktAccountSpendableTezBalance = ({ balance, stakedBalance, unstakedBalance }: TzktAccount) =>
  ((balance ?? 0) - (stakedBalance ?? 0) - (unstakedBalance ?? 0)).toFixed();

type ParameterFa12 =
  | {
      entrypoint: 'transfer';
      value: {
        to: string;
        from: string;
        value: string;
      };
    }
  | {
      entrypoint: 'approve';
      value: {
        spender: string;
        value: string;
      };
    };

interface Fa2Transaction {
  to_: string;
  amount: string;
  token_id: string;
}

interface ParameterFa2 {
  entrypoint: string;
  value: any[];
}

export interface ParameterFa2Transfer extends ParameterFa2 {
  entrypoint: string;
  value: {
    txs: Fa2Transaction[];
    from_: string;
  }[];
}

interface ParameterFa2Approve extends ParameterFa2 {
  entrypoint: 'update_operators';
  value: {
    add_operator: {
      operator: string;
      owner: string;
      token_id: string;
    };
  }[];
}

interface ParameterLiquidityBaking {
  entrypoint: string;
  value: {
    target: string;
    quantity: string; // can be 'number' or '-number
  };
}

export function isTzktOperParam(param: any): param is {
  entrypoint: string;
  value: any;
} {
  if (param == null) return false;
  if (typeof param.entrypoint !== 'string') return false;
  return 'value' in param;
}

export function isTzktOperParam_Fa12(param: any): param is ParameterFa12 {
  if (!isTzktOperParam(param)) return false;
  if (param.value == null) return false;

  if (param.entrypoint === 'approve') {
    const { spender, value } = param.value;

    return typeof spender === 'string' && typeof value === 'string';
  }

  // 'transfer' case

  const { to, from, value } = param.value;

  return typeof from === 'string' && typeof to === 'string' && typeof value === 'string';
}

function isTzktOperParam_Fa2(param: any): param is ParameterFa2 {
  if (!isTzktOperParam(param)) return false;
  if (!Array.isArray(param.value)) return false;
  if (param.value[0] == null) return true;

  return true;
}

/**
 * (!) Might only refer to `param.entrypoint === 'transfer'` case
 * (?) So, would this check be enough?
 */
export function isTzktOperParam_Fa2_approve(param: any): param is ParameterFa2Approve {
  if (!isTzktOperParam_Fa2(param)) return false;
  const add_operator = param.value[0]?.add_operator;
  if (add_operator == null) return false;

  const { operator, owner, token_id } = add_operator;

  return typeof operator === 'string' && typeof owner === 'string' && typeof token_id === 'string';
}

/**
 * (!) Might only refer to `param.entrypoint === 'transfer'` case
 * (?) So, would this check be enough?
 */
export function isTzktOperParam_Fa2_transfer(param: any): param is ParameterFa2Transfer {
  if (!isTzktOperParam_Fa2(param)) return false;
  let item = param.value[0];
  if (item == null) return true;
  if (typeof item.from_ !== 'string') return false;
  if (!Array.isArray(item.txs)) return false;
  item = item.txs[0];
  if (item == null) return true;
  if (typeof item.to_ !== 'string') return false;
  if (typeof item.amount !== 'string') return false;
  if (typeof item.token_id !== 'string') return false;

  return true;
}

export function isTzktOperParam_LiquidityBaking(param: any): param is ParameterLiquidityBaking {
  if (!isTzktOperParam(param)) return false;
  if (param.value == null) return false;
  if (typeof param.value.target !== 'string') return false;
  if (typeof param.value.quantity !== 'string') return false;

  return true;
}

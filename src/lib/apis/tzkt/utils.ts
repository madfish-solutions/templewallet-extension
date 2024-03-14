import { TzktAccount } from './types';

export const calcTzktAccountSpendableTezBalance = ({ balance, stakedBalance, unstakedBalance }: TzktAccount) =>
  ((balance ?? 0) - (stakedBalance ?? 0) - (unstakedBalance ?? 0)).toFixed();

type ParameterFa12 = {
  entrypoint: string;
  value: {
    to: string;
    from: string;
    value: string;
  };
};

interface Fa2Transaction {
  to_: string;
  amount: string;
  token_id: string;
}

interface Fa2OpParams {
  txs: Fa2Transaction[];
  from_: string;
}

export type ParameterFa2 = {
  entrypoint: string;
  value: Fa2OpParams[];
};
type ParameterLiquidityBaking = {
  entrypoint: string;
  value: {
    target: string;
    quantity: string; // can be 'number' or '-number
  };
};

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
  if (typeof param.value.to !== 'string') return false;
  if (typeof param.value.from !== 'string') return false;
  if (typeof param.value.value !== 'string') return false;

  return true;
}

/**
 * (!) Might only refer to `param.entrypoint === 'transfer'` case
 * (?) So, would this check be enough?
 */
export function isTzktOperParam_Fa2(param: any): param is ParameterFa2 {
  if (!isTzktOperParam(param)) return false;
  if (!Array.isArray(param.value)) return false;
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

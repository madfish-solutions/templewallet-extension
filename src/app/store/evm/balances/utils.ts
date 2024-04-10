import { BalanceItem, BalancesResponse } from 'lib/apis/temple/evm-data.interfaces';
import { toTokenSlug } from 'lib/assets';

import { EVMBalancesAtomicRecord } from './state';

const getKeyForBalancesRecord = (publicKeyHash: string, chainId: string) => `${publicKeyHash}_${chainId}`;

export const getBalancesAtomicRecord = (publicKeyHash: string, data: BalancesResponse[]) =>
  data.reduce<EVMBalancesAtomicRecord>((acc, currentValue) => {
    acc[getKeyForBalancesRecord(publicKeyHash, currentValue.chain_id.toString())] = getTokenSlugBalanceRecord(
      currentValue.items
    );

    return acc;
  }, {});

const getTokenSlugBalanceRecord = (data: BalanceItem[]) =>
  data.reduce<StringRecord>((acc, currentValue) => {
    acc[toTokenSlug(currentValue.contract_address)] = currentValue.balance ?? '';

    return acc;
  }, {});

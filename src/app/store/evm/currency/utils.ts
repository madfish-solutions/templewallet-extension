import { BalanceItem, BalancesResponse, ChainID } from 'lib/apis/temple/evm-data.interfaces';
import { toTokenSlug } from 'lib/assets';

import { EVMExchangeRateRecords } from './state';

const getKeyForExchangeRatesRecord = (slug: string, chainId: ChainID) => `${slug}_${chainId}`;

export const getStoredExchangeRatesRecord = (data: BalancesResponse[]) =>
  data.reduce<EVMExchangeRateRecords>(
    (acc, currentValue) =>
      Object.assign({}, acc, getTokenSlugWithChainIdExchangeRatesRecord(currentValue.chain_id, currentValue.items)),
    {}
  );

const getTokenSlugWithChainIdExchangeRatesRecord = (chainID: ChainID, data: BalanceItem[]) =>
  data.reduce<EVMExchangeRateRecords>((acc, currentValue) => {
    acc[getKeyForExchangeRatesRecord(toTokenSlug(currentValue.contract_address), chainID)] =
      currentValue.quote_rate ?? 0;

    return acc;
  }, {});

import { BalanceItem, BalancesResponse, ChainID } from 'lib/apis/temple/evm-data.interfaces';
import { toTokenSlug } from 'lib/assets';
import { getEvmAssetRecordKey, isProperMetadata } from 'lib/utils/evm.utils';

import { EVMExchangeRateRecords } from './state';

export const getStoredExchangeRatesRecord = (data: BalancesResponse[]) =>
  data.reduce<EVMExchangeRateRecords>((acc, currentValue) => {
    if (!currentValue.chain_id) return acc;

    return Object.assign(
      {},
      acc,
      getTokenSlugWithChainIdExchangeRatesRecord(currentValue.chain_id, currentValue.items)
    );
  }, {});

const getTokenSlugWithChainIdExchangeRatesRecord = (chainID: ChainID, data: BalanceItem[]) =>
  data.reduce<EVMExchangeRateRecords>((acc, currentValue) => {
    if (!isProperMetadata(currentValue)) {
      return acc;
    }

    acc[getEvmAssetRecordKey(toTokenSlug(currentValue.contract_address), chainID)] = currentValue.quote_rate ?? 0;

    return acc;
  }, {});

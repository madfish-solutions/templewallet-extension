import { BalanceItem, BalancesResponse, ChainID } from 'lib/apis/temple/evm-data.interfaces';
import { toTokenSlug } from 'lib/assets';
import { getEvmAssetRecordKey, isProperMetadata } from 'lib/utils/evm.utils';

import { EVMStoredAssetsRecords, TokenSlugWithChainIdStoredAssetRecord } from './state';

export const getStoredAssetsRecord = (publicKeyHash: string, data: BalancesResponse[]) =>
  data.reduce<EVMStoredAssetsRecords>((acc, currentValue) => {
    if (!currentValue.chain_id) return acc;

    acc[publicKeyHash] = Object.assign(
      {},
      acc[publicKeyHash] ?? {},
      getTokenSlugStoredAssetRecord(currentValue.chain_id, currentValue.items)
    );

    return acc;
  }, {});

const getTokenSlugStoredAssetRecord = (chainID: ChainID, data: BalanceItem[]) =>
  data.reduce<TokenSlugWithChainIdStoredAssetRecord>((acc, currentValue) => {
    if (!isProperMetadata(currentValue)) {
      return acc;
    }

    acc[getEvmAssetRecordKey(toTokenSlug(currentValue.contract_address), chainID)] = { status: 'idle' };

    return acc;
  }, {});

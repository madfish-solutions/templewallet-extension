import { BalanceItem, BalancesResponse, ChainID } from 'lib/apis/temple/evm-data.interfaces';
import { toTokenSlug } from 'lib/assets';
import { getEvmAssetRecordKey, isProperMetadata } from 'lib/utils/evm.utils';

import { EVMStoredAssetsRecords, TokenSlugWithChainIdStoredAssetRecord } from './state';

export const getNewStoredAssetsRecord = (
  oldRecord: EVMStoredAssetsRecords,
  publicKeyHash: string,
  data: BalancesResponse[]
) =>
  data.reduce<EVMStoredAssetsRecords>((acc, currentValue) => {
    if (!currentValue.chain_id) return acc;

    acc[publicKeyHash] = Object.assign(
      acc[publicKeyHash] ?? {},
      getTokenSlugStoredAssetRecord(oldRecord[publicKeyHash] ?? {}, currentValue.chain_id, currentValue.items)
    );

    return acc;
  }, oldRecord);

const getTokenSlugStoredAssetRecord = (
  oldRecord: TokenSlugWithChainIdStoredAssetRecord,
  chainID: ChainID,
  data: BalanceItem[]
) =>
  data.reduce<TokenSlugWithChainIdStoredAssetRecord>((acc, currentValue) => {
    if (!isProperMetadata(currentValue)) {
      return acc;
    }

    const recordKey = getEvmAssetRecordKey(toTokenSlug(currentValue.contract_address), chainID);
    const oldRecordValue = oldRecord[recordKey];

    if (!oldRecordValue?.manual) {
      acc[recordKey] = { status: 'idle' };
    }

    return acc;
  }, {});

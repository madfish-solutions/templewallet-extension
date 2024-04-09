import { BalanceItem, BalancesResponse, ChainID } from 'lib/apis/temple/evm-data.interfaces';
import { toTokenSlug } from 'lib/assets';

import { EVMStoredAssetsRecords, TokenSlugWithChainIdStoredAssetRecord } from './state';

export const getKeyForAssetsRecord = (slug: string, chainId: ChainID) => `${slug}_${chainId}`;

export const getStoredAssetsRecord = (publicKeyHash: string, data: BalancesResponse[]) =>
  data.reduce<EVMStoredAssetsRecords>((acc, currentValue) => {
    acc[publicKeyHash] = Object.assign(
      {},
      acc[publicKeyHash] ?? {},
      getTokenSlugStoredAssetRecord(currentValue.chain_id, currentValue.items)
    );

    return acc;
  }, {});

const getTokenSlugStoredAssetRecord = (chainID: ChainID, data: BalanceItem[]) =>
  data.reduce<TokenSlugWithChainIdStoredAssetRecord>((acc, currentValue) => {
    acc[getKeyForAssetsRecord(toTokenSlug(currentValue.contract_address), chainID)] = { status: 'idle' };

    return acc;
  }, {});

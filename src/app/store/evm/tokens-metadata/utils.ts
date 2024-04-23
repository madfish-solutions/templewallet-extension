import { BalanceItem, BalancesResponse, ChainID } from 'lib/apis/temple/evm-data.interfaces';
import { toTokenSlug } from 'lib/assets';
import { getEvmAssetRecordKey, isProperMetadata } from 'lib/utils/evm.utils';

import { EVMMetadataRecords } from './state';

export const getStoredTokensMetadataRecord = (data: BalancesResponse[]) =>
  data.reduce<EVMMetadataRecords>((acc, currentValue) => {
    if (!currentValue.chain_id) return acc;

    return Object.assign(
      {},
      acc,
      getTokenSlugWithChainIdTokensMetadataRecord(currentValue.chain_id, currentValue.items)
    );
  }, {});

const getTokenSlugWithChainIdTokensMetadataRecord = (chainID: ChainID, data: BalanceItem[]) =>
  data.reduce<EVMMetadataRecords>((acc, currentValue) => {
    if (!isProperMetadata(currentValue)) {
      return acc;
    }

    acc[getEvmAssetRecordKey(toTokenSlug(currentValue.contract_address), chainID)] = {
      name: currentValue.contract_display_name,
      symbol: currentValue.contract_ticker_symbol,
      decimals: currentValue.contract_decimals,
      thumbnailUri: currentValue.logo_url,
      address: currentValue.contract_address,
      native: currentValue.native_token
    };

    return acc;
  }, {});

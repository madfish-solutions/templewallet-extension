import { BalanceItem, BalancesResponse, ChainID } from 'lib/apis/temple/evm-data.interfaces';
import { toTokenSlug } from 'lib/assets';

import { EVMMetadataRecords } from './state';

const getKeyForTokensMetadataRecord = (slug: string, chainId: ChainID) => `${slug}_${chainId}`;

export const getStoredTokensMetadataRecord = (data: BalancesResponse[]) =>
  data.reduce<EVMMetadataRecords>(
    (acc, currentValue) =>
      Object.assign({}, acc, getTokenSlugWithChainIdTokensMetadataRecord(currentValue.chain_id, currentValue.items)),
    {}
  );

const getTokenSlugWithChainIdTokensMetadataRecord = (chainID: ChainID, data: BalanceItem[]) =>
  data.reduce<EVMMetadataRecords>((acc, currentValue) => {
    acc[getKeyForTokensMetadataRecord(toTokenSlug(currentValue.contract_address), chainID)] = {
      name: currentValue.contract_display_name,
      symbol: currentValue.contract_ticker_symbol,
      decimals: currentValue.contract_decimals,
      thumbnailUri: currentValue.logo_url,
      address: currentValue.contract_address,
      chainID: chainID,
      native: currentValue.native_token
    };

    return acc;
  }, {});

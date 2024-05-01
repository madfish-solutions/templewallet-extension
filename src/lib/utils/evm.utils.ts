import { BalanceItem, NftData, NftTokenContractBalanceItem } from 'lib/apis/temple/evm-data.interfaces';

export const isProperTokenMetadata = (metadata: BalanceItem) =>
  Boolean(
    metadata.contract_address &&
      metadata.contract_ticker_symbol &&
      metadata.contract_display_name &&
      metadata.contract_decimals
  );

export const isProperCollectibleContract = (contract: NftTokenContractBalanceItem) =>
  Boolean(contract.contract_name && contract.contract_address && contract.contract_ticker_symbol);

export const isProperCollectibleMetadata = (
  collectible: NftData
): collectible is NonNullableField<NftData, 'token_id' | 'external_data'> =>
  Boolean(collectible.token_id && collectible.external_data);

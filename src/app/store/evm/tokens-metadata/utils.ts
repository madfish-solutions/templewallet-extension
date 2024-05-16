import { BalanceItem } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { EvmTokenMetadata } from 'lib/metadata/types';

export const buildEvmTokenMetadataFromFetched = (data: BalanceItem): EvmTokenMetadata => ({
  address: data.contract_address as HexString,
  name: data.contract_display_name ?? '???',
  symbol: data.contract_ticker_symbol ?? '???',
  decimals: data.contract_decimals ?? 0,
  thumbnailUri: data.logo_url,
  native: data.native_token
});

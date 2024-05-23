import { BalanceItem } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { EvmAssetStandard } from 'lib/evm/types';
import { EVM_NATIVE_TOKEN_ADDRESS, EvmTokenMetadata } from 'lib/metadata/types';

export const buildEvmTokenMetadataFromFetched = (data: BalanceItem): EvmTokenMetadata => ({
  standard: EvmAssetStandard.ERC20,
  address: data.native_token ? EVM_NATIVE_TOKEN_ADDRESS : (data.contract_address as HexString),
  name: data.contract_display_name ?? '???',
  symbol: data.contract_ticker_symbol ?? '???',
  decimals: data.contract_decimals ?? 0,
  native: data.native_token
});

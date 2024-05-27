import { getAddress } from 'viem';

import { BalanceItem } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { EvmAssetStandard } from 'lib/evm/types';
import { EvmTokenMetadata } from 'lib/metadata/types';

export const buildEvmTokenMetadataFromFetched = (data: BalanceItem): EvmTokenMetadata => ({
  standard: EvmAssetStandard.ERC20,
  address: getAddress(data.contract_address),
  name: data.contract_display_name ?? undefined,
  symbol: data.contract_ticker_symbol ?? undefined,
  decimals: data.contract_decimals ?? undefined
});

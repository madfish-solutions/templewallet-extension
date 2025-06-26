import { isDefined } from '@rnw-community/shared';

import { BalanceItem } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { EvmAssetStandard } from 'lib/evm/types';
import { EvmTokenMetadata } from 'lib/metadata/types';

export const buildEvmTokenMetadataFromFetched = (data: BalanceItem, contractAddress: HexString): EvmTokenMetadata => ({
  standard: EvmAssetStandard.ERC20,
  address: contractAddress,
  name: data.contract_display_name ?? undefined,
  symbol: data.contract_ticker_symbol ?? undefined,
  decimals: data.contract_decimals ?? undefined,
  iconURL: data.logo_url ?? undefined
});

/** While `decimals` is an optional method on ERC-20 contract by
 * the standard (see: https://eips.ethereum.org/EIPS/eip-20#decimals),
 * we judge the validity of metadata values in API's response by the presence of this one.
 */
export const isValidFetchedEvmMetadata = (item: BalanceItem) => isDefined(item.contract_decimals);

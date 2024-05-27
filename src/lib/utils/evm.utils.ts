import { BalanceItem, BalanceNftData, NftData } from 'lib/apis/temple/endpoints/evm/api.interfaces';

import { EVM_NATIVE_CURRENCY_ADDRESS, EvmTokenMetadata } from '../metadata/types';

export const isPositiveTokenBalance = (data: BalanceItem): data is NonNullableField<BalanceItem, 'balance'> =>
  Boolean(data.balance && data.balance !== '0');

export const isPositiveCollectibleBalance = (
  data: BalanceNftData
): data is NonNullableField<BalanceNftData, 'token_id' | 'token_balance'> =>
  Boolean(data.token_id && data.token_balance && data.token_balance !== '0');

export const isProperCollectibleMetadata = (
  data: NftData
): data is NonNullableField<NftData, 'token_id' | 'external_data' | 'token_url'> =>
  Boolean(
    data.token_id &&
      data.token_url &&
      data.external_data &&
      data.external_data.image &&
      data.external_data.name &&
      data.external_data.description
  );

export const isEvmNativeTokenSlug = (slug: string) => slug === EVM_NATIVE_CURRENCY_ADDRESS;

export const isEvmTokenMetadata = (metadata: any): metadata is EvmTokenMetadata => Boolean(metadata.standard);

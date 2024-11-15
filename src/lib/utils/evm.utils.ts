import { NftData } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';

export const isPositiveTokenBalance = <T extends { balance: string | null }>(
  data: T
): data is NonNullableField<T, 'balance'> => Boolean(data.balance && data.balance !== '0');

export const isPositiveCollectibleBalance = <T extends Record<'token_id' | 'token_balance', string | null>>(
  data: T
): data is NonNullableField<T, 'token_id' | 'token_balance'> =>
  Boolean(data.token_id && data.token_balance && data.token_balance !== '0');

export const isProperCollectibleMetadata = (
  data: NftData
): data is NonNullableField<NftData, 'token_id' | 'external_data' | 'token_url'> =>
  Boolean(data.token_id && data.token_url && data.external_data);

export const isEvmNativeTokenSlug = (slug: string): slug is typeof EVM_TOKEN_SLUG => slug === EVM_TOKEN_SLUG;

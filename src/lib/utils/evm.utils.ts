import { BalanceItem, BalanceNftData, NftData } from 'lib/apis/temple/endpoints/evm/api.interfaces';

export const isPositiveTokenBalance = (data: BalanceItem): data is NonNullableField<BalanceItem, 'balance'> =>
  Boolean(data.balance && data.balance !== '0');

export const isPositiveCollectibleBalance = (
  data: BalanceNftData
): data is NonNullableField<BalanceNftData, 'token_id' | 'token_balance'> =>
  Boolean(data.token_id && data.token_balance && data.token_balance !== '0');

export const isProperCollectibleMetadata = (
  data: NftData
): data is NonNullableField<NftData, 'token_id' | 'external_data'> => Boolean(data.token_id && data.external_data);

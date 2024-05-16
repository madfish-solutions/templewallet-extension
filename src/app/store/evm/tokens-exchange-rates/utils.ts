import { BalanceItem } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { toTokenSlug } from 'lib/assets';
import { isPositiveTokenBalance } from 'lib/utils/evm.utils';

import { TokenSlugExchangeRateRecord } from './state';

export const getTokenSlugExchangeRateRecord = (data: BalanceItem[]) =>
  data.reduce<TokenSlugExchangeRateRecord>((acc, currentValue) => {
    if ((!currentValue.native_token && !isPositiveTokenBalance(currentValue)) || !currentValue.quote_rate) return acc;

    acc[toTokenSlug(currentValue.contract_address)] = currentValue.quote_rate;

    return acc;
  }, {});

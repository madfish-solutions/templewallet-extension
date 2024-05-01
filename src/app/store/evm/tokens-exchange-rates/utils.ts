import { BalanceItem } from 'lib/apis/temple/evm-data.interfaces';
import { toTokenSlug } from 'lib/assets';
import { isProperTokenMetadata } from 'lib/utils/evm.utils';

import { TokenSlugExchangeRateRecord } from './state';

export const getTokenSlugExchangeRateRecord = (data: BalanceItem[]) =>
  data.reduce<TokenSlugExchangeRateRecord>((acc, currentValue) => {
    if (!isProperTokenMetadata(currentValue) || !currentValue.quote_rate) return acc;

    acc[toTokenSlug(currentValue.contract_address)] = currentValue.quote_rate;

    return acc;
  }, {});

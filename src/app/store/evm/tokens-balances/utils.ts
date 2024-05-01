import { BalanceItem } from 'lib/apis/temple/evm-data.interfaces';
import { toTokenSlug } from 'lib/assets';
import { isProperTokenMetadata } from 'lib/utils/evm.utils';

import { TokenSlugBalanceRecord } from './state';

export const getTokenSlugBalanceRecord = (data: BalanceItem[]) =>
  data.reduce<TokenSlugBalanceRecord>((acc, currentValue) => {
    if (!isProperTokenMetadata(currentValue) || !currentValue.balance) return acc;

    acc[toTokenSlug(currentValue.contract_address)] = currentValue.balance;

    return acc;
  }, {});

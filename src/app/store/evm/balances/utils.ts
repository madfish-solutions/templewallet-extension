import { BalanceItem } from 'lib/apis/temple/evm-data.interfaces';
import { toTokenSlug } from 'lib/assets';
import { isPositiveCollectibleBalance, isPositiveTokenBalance } from 'lib/utils/evm.utils';

import { TokenSlugBalanceRecord } from './state';

export const getTokenSlugBalanceRecord = (data: BalanceItem[]) =>
  data.reduce<TokenSlugBalanceRecord>((acc, currentValue) => {
    if (currentValue.nft_data) {
      for (const nftItem of currentValue.nft_data) {
        if (!isPositiveCollectibleBalance(nftItem)) continue;

        acc[toTokenSlug(currentValue.contract_address, nftItem.token_id)] = nftItem.token_balance;
      }

      return acc;
    }

    if ((data.length > 1 && !isPositiveTokenBalance(currentValue)) || !currentValue.balance) return acc;

    acc[toTokenSlug(currentValue.contract_address)] = currentValue.balance;

    return acc;
  }, {});

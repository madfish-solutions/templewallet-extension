import { getAddress } from 'viem';

import { BalanceItem } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { NATIVE_TOKEN_INDEX } from 'lib/apis/temple/endpoints/evm/api.utils';
import { toTokenSlug } from 'lib/assets';
import { isPositiveCollectibleBalance, isPositiveTokenBalance } from 'lib/utils/evm.utils';

import { EVM_TOKEN_SLUG } from '../../../../lib/assets/defaults';

import { AssetSlugBalanceRecord } from './state';

export const getTokenSlugBalanceRecord = (data: BalanceItem[]) =>
  data.reduce<AssetSlugBalanceRecord>((acc, currentValue, currentIndex) => {
    const contractAddress = getAddress(currentValue.contract_address);

    if (currentValue.nft_data) {
      for (const nftItem of currentValue.nft_data) {
        if (!isPositiveCollectibleBalance(nftItem)) continue;

        acc[toTokenSlug(contractAddress, nftItem.token_id)] = nftItem.token_balance;
      }

      return acc;
    }

    if (!isPositiveTokenBalance(currentValue)) return acc;

    if (currentIndex === NATIVE_TOKEN_INDEX) {
      acc[EVM_TOKEN_SLUG] = currentValue.balance;
    } else {
      acc[toTokenSlug(contractAddress)] = currentValue.balance;
    }

    return acc;
  }, {});

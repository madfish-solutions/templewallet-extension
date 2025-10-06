import { pick } from 'lodash';

import { StoredHDAccount } from 'lib/temple/types';
import { useAllAccounts } from 'temple/front';
import { RewardsAddresses } from 'temple/types';

export const useRewardsAddresses = (): RewardsAddresses => {
  const allAccounts = useAllAccounts();
  const rewardsAccount = allAccounts[0] as StoredHDAccount | undefined;

  return rewardsAccount ? pick(rewardsAccount, ['tezosAddress', 'evmAddress']) : {};
};

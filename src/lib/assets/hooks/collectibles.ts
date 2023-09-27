import { useMemo } from 'react';

import { isEqual } from 'lodash';

import { useAccountAssetsSelector } from 'app/store/assets/selectors';
import type { StoredAssetStatus } from 'app/store/assets/state';
import { useBalancesSelector } from 'app/store/balances/selectors';
import { useAccount, useChainId } from 'lib/temple/front';
import { useMemoWithCompare } from 'lib/ui/hooks';

import { getAssetStatus } from './utils';

interface AccountToken {
  slug: string;
  status: StoredAssetStatus;
  predefined?: boolean;
}

export const useAccountCollectibles = (account: string, chainId: string) => {
  const stored = useAccountAssetsSelector(account, chainId, 'collectibles');

  const balances = useBalancesSelector(account, chainId);

  return useMemoWithCompare<AccountToken[]>(
    () =>
      stored.reduce<AccountToken[]>(
        (acc, { slug, status }) =>
          status === 'removed' ? acc : acc.concat({ slug, status: getAssetStatus(balances[slug], status) }),
        []
      ),
    [stored, balances],
    isEqual
  );
};

export const useEnabledAccountCollectiblesSlugs = () => {
  const chainId = useChainId(true)!;
  const { publicKeyHash } = useAccount();

  const collectibles = useAccountCollectibles(publicKeyHash, chainId);

  return useMemo(
    () => collectibles.reduce<string[]>((acc, { slug, status }) => (status === 'enabled' ? acc.concat(slug) : acc), []),
    [collectibles]
  );
};

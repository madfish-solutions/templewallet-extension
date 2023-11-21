import { useMemo } from 'react';

import { isEqual } from 'lodash';

import { useAccountAssetsSelector } from 'app/store/assets/selectors';
import { useAllBalancesSelector } from 'app/store/balances/selectors';
import { useAccount, useChainId } from 'lib/temple/front';
import { useMemoWithCompare } from 'lib/ui/hooks';

import type { AccountAsset } from '../types';
import { getAssetStatus } from './utils';

export const useAccountCollectibles = (account: string, chainId: string) => {
  const stored = useAccountAssetsSelector(account, chainId, 'collectibles');

  const balances = useAllBalancesSelector(account, chainId);

  return useMemoWithCompare<AccountAsset[]>(
    () =>
      stored.reduce<AccountAsset[]>(
        (acc, { slug, status }) =>
          status === 'removed' ? acc : acc.concat({ slug, status: getAssetStatus(balances[slug], status) }),
        []
      ),
    [stored, balances],
    (prev, next) => {
      if (prev.length !== next.length) return false;

      return next.every((item, i) => {
        const prevItem = prev[i]!;
        return item.slug === prevItem.slug && item.status === prevItem.status;
      });
    }
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

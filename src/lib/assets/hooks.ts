import { useMemo } from 'react';

import { ChainIds } from '@taquito/taquito';
import { isEqual, sortBy, uniqBy } from 'lodash';

import { useAccountTokensSelector, useMainnetTokensWhitelistSelector } from 'app/store/assets/selectors';
import type { StoredAssetStatus } from 'app/store/assets/state';
import { useBalancesSelector } from 'app/store/balances/selectors';
import { useAccount, useChainId } from 'lib/temple/front';
import { useMemoWithCompare } from 'lib/ui/hooks';

import { PREDEFINED_TOKENS_METADATA } from './known-tokens';
import { tokenToSlug } from './utils';

type AssetStatus = Exclude<StoredAssetStatus, 'removed'>;

interface AccountToken {
  slug: string;
  // decimals: number;
  status: AssetStatus;
  predefined?: boolean;
}

const TOKENS_SORT_ITERATEES: (keyof AccountToken)[] = ['predefined', 'slug'];

export const useAccountTokens = (account: string, chainId: string) => {
  const stored = useAccountTokensSelector(account, chainId);
  const whitelistSlugs = useWhitelistSlugs(chainId);

  const balances = useBalancesSelector(account, chainId);

  return useMemoWithCompare<AccountToken[]>(
    () => {
      // 1. Stored
      const storedReduced = stored.reduce<AccountToken[]>(
        (acc, { slug, status }) =>
          status === 'removed' ? acc : acc.concat({ slug, status: getTokenStatus(balances[slug], status) }),
        []
      );

      // 2. Predefined
      const predefinedMetadata = PREDEFINED_TOKENS_METADATA[chainId];

      const predefined = predefinedMetadata
        ? predefinedMetadata.reduce<AccountToken[]>((acc, metadata) => {
            const slug = tokenToSlug(metadata);
            const storedStatus = stored.find(t => t.slug === slug)?.status;

            return storedStatus === 'removed'
              ? acc
              : acc.concat({ slug, status: storedStatus ?? 'enabled', predefined: true });
          }, [])
        : [];

      // 3. Whitelisted
      const whitelisted = whitelistSlugs.reduce<AccountToken[]>((acc, slug) => {
        const storedStatus = stored.find(t => t.slug === slug)?.status;

        return storedStatus === 'removed' ? acc : acc.concat({ slug, status: getTokenStatus(balances[slug]) });
      }, []);

      // Keep this order to preserve correct statuses & flags
      const tokens = predefined.concat(storedReduced).concat(whitelisted);

      return sortBy(
        uniqBy(tokens, t => t.slug),
        TOKENS_SORT_ITERATEES
      );
    },
    [stored, chainId, whitelistSlugs, balances],
    isEqual
  );
};

export const useEnabledAccountTokens = () => {
  const chainId = useChainId(true)!;
  const { publicKeyHash } = useAccount();

  const tokens = useAccountTokens(publicKeyHash, chainId);

  return useMemo(() => tokens.filter(({ status }) => status === 'enabled'), [tokens]);
};

const getTokenStatus = (atomicBalance: string, storedStatus?: AssetStatus): AssetStatus =>
  storedStatus || (Number(atomicBalance) > 0 ? 'enabled' : 'disabled');

const useWhitelistSlugs = (chainId: string) => {
  const mainnetWhitelist = useMainnetTokensWhitelistSelector();

  return useMemoWithCompare(
    () => (chainId === ChainIds.MAINNET ? mainnetWhitelist.data : []),
    [chainId, mainnetWhitelist],
    (a, b) => a.join('') === b.join('')
  );
};

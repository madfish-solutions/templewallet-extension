import { useMemo } from 'react';

import { ChainIds } from '@taquito/taquito';
import { isEqual, sortBy, uniqBy } from 'lodash';

import {
  useAllAssetsSelector,
  useAccountAssetsSelector,
  useMainnetTokensWhitelistSelector
} from 'app/store/assets/selectors';
import type { StoredAssetStatus } from 'app/store/assets/state';
import { useBalancesSelector } from 'app/store/balances/selectors';
import { useAccount, useChainId } from 'lib/temple/front';
import { useMemoWithCompare } from 'lib/ui/hooks';

import { PREDEFINED_TOKENS_METADATA } from '../known-tokens';
import { tokenToSlug } from '../utils';
import { getAssetStatus } from './utils';

export interface AccountToken {
  slug: string;
  status: StoredAssetStatus;
  predefined?: boolean;
}

export const useAllAvailableTokens = (account: string, chainId: string) => {
  const tokens = useAccountTokens(account, chainId);
  const allTokensStored = useAllAssetsSelector('tokens');

  return useMemo(() => {
    const removedSlugs = tokens.reduce<string[]>((acc, t) => (t.status === 'removed' ? acc.concat(t.slug) : acc), []);

    const allTokens = allTokensStored.filter(t => t.chainId === chainId);

    const otherTokens = allTokens.reduce<AccountToken[]>((acc, curr) => {
      if (curr.account === account || curr.status === 'removed' || removedSlugs.includes(curr.slug)) return acc;

      return acc.concat({ slug: curr.slug, status: 'disabled' });
    }, []);

    // Keep this order to preserve correct statuses & flags
    const concatenated = tokens.concat(otherTokens);

    return sortBy(
      uniqBy(concatenated, t => t.slug),
      TOKENS_SORT_ITERATEES
    );
  }, [tokens, allTokensStored, account, chainId]);
};

export const useEnabledAccountTokensSlugs = () => {
  const chainId = useChainId(true)!;
  const { publicKeyHash } = useAccount();

  const tokens = useAccountTokens(publicKeyHash, chainId);

  return useMemo(
    () => tokens.reduce<string[]>((acc, { slug, status }) => (status === 'enabled' ? acc.concat(slug) : acc), []),
    [tokens]
  );
};

/**
 * Sorting is needed to preserve some tokens order (avoid UI listing jumps)
 * after merge of multiple sources (e.g. stored, predefined, whitelist)
 */
const TOKENS_SORT_ITERATEES: (keyof AccountToken)[] = ['predefined', 'slug'];

const useAccountTokens = (account: string, chainId: string) => {
  const storedRaw = useAccountAssetsSelector(account, chainId, 'tokens');
  const whitelistSlugs = useWhitelistSlugs(chainId);

  const balances = useBalancesSelector(account, chainId);

  return useMemoWithCompare<AccountToken[]>(
    () => {
      // 1. Stored
      const stored = storedRaw.map<AccountToken>(({ slug, status }) => ({
        slug,
        status: getAssetStatus(balances[slug], status)
      }));

      // 2. Predefined
      const predefinedMetadata = PREDEFINED_TOKENS_METADATA[chainId];

      const predefined = predefinedMetadata
        ? predefinedMetadata.map<AccountToken>(metadata => {
            const slug = tokenToSlug(metadata);
            const storedStatus = storedRaw.find(t => t.slug === slug)?.status;

            return { slug, status: storedStatus ?? 'enabled', predefined: true };
          })
        : [];

      // 3. Whitelisted
      const whitelisted = whitelistSlugs.map<AccountToken>(slug => ({ slug, status: getAssetStatus(balances[slug]) }));

      // Keep this order to preserve correct statuses & flags
      const concatenated: AccountToken[] = predefined.concat(stored).concat(whitelisted);

      return sortBy(
        uniqBy(concatenated, t => t.slug),
        TOKENS_SORT_ITERATEES
      );
    },
    [chainId, storedRaw, whitelistSlugs, balances],
    isEqual
  );
};

const useWhitelistSlugs = (chainId: string) => {
  const mainnetWhitelist = useMainnetTokensWhitelistSelector();

  return useMemoWithCompare(
    () => (chainId === ChainIds.MAINNET ? mainnetWhitelist : []),
    [chainId, mainnetWhitelist],
    (a, b) => a.join('') === b.join('')
  );
};

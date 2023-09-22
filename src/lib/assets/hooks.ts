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

import { PREDEFINED_TOKENS_METADATA } from './known-tokens';
import { tokenToSlug } from './utils';

type AssetStatus = Exclude<StoredAssetStatus, 'removed'>;

interface AccountToken {
  slug: string;
  // decimals: number;
  status: AssetStatus;
  predefined?: boolean;
}

/**
 * Sorting is needed to preserve some tokens order (avoid UI listing jumps)
 * after merge of multiple sources (e.g. stored, predefined, whitelist)
 */
const TOKENS_SORT_ITERATEES: (keyof AccountToken)[] = ['predefined', 'slug'];

const useAccountTokens = (account: string, chainId: string) => {
  const stored = useAccountAssetsSelector(account, chainId, 'tokens');
  const whitelistSlugs = useWhitelistSlugs(chainId);

  const balances = useBalancesSelector(account, chainId);

  return useMemoWithCompare<AccountToken[]>(
    () => {
      // 1. Stored
      const storedReduced = stored.reduce<AccountToken[]>(
        (acc, { slug, status }) =>
          status === 'removed' ? acc : acc.concat({ slug, status: getAssetStatus(balances[slug], status) }),
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

        return storedStatus === 'removed' ? acc : acc.concat({ slug, status: getAssetStatus(balances[slug]) });
      }, []);

      // Keep this order to preserve correct statuses & flags
      const concatenated: AccountToken[] = predefined.concat(storedReduced).concat(whitelisted);

      return sortBy(
        uniqBy(concatenated, t => t.slug),
        TOKENS_SORT_ITERATEES
      );
    },
    [chainId, stored, whitelistSlugs, balances],
    isEqual
  );
};

export const useAllAvailableTokens = (account: string, chainId: string) => {
  const tokens = useAccountTokens(account, chainId);
  const allTokensStored = useAllAssetsSelector('tokens');

  return useMemo(() => {
    const allTokens = allTokensStored.filter(t => t.chainId === chainId);

    const removedSlugs = allTokens.reduce<string[]>(
      (acc, t) => (t.status === 'removed' && t.account === account ? acc.concat(t.slug) : acc),
      []
    );

    const otherTokens = allTokens.reduce<AccountToken[]>((acc, curr) => {
      if (curr.account === account || removedSlugs.includes(curr.slug)) return acc;

      return acc.concat({ slug: curr.slug, status: 'disabled' });
    }, []);

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

const useWhitelistSlugs = (chainId: string) => {
  const mainnetWhitelist = useMainnetTokensWhitelistSelector();

  return useMemoWithCompare(
    () => (chainId === ChainIds.MAINNET ? mainnetWhitelist.data : []),
    [chainId, mainnetWhitelist],
    (a, b) => a.join('') === b.join('')
  );
};

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

const getAssetStatus = (atomicBalance: string, storedStatus?: AssetStatus): AssetStatus =>
  storedStatus || (Number(atomicBalance) > 0 ? 'enabled' : 'disabled');

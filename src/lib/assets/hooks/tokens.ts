import { useMemo } from 'react';

import { ChainIds } from '@taquito/taquito';
import { isEqual, sortBy, uniqBy } from 'lodash';

import {
  useAllTokensSelector,
  useAccountTokensSelector,
  useMainnetTokensWhitelistSelector
} from 'app/store/assets/selectors';
import { isAccountAssetsStoreKeyOfSameChainIdAndDifferentAccount } from 'app/store/assets/utils';
import { useAllAccountBalancesSelector } from 'app/store/balances/selectors';
import { useAccount, useChainId } from 'lib/temple/front';
import { useMemoWithCompare } from 'lib/ui/hooks';

import { PREDEFINED_TOKENS_METADATA } from '../known-tokens';
import type { AccountAsset } from '../types';
import { tokenToSlug } from '../utils';

import { isAssetStatusIdle, getAssetStatus } from './utils';

interface AccountToken extends AccountAsset {
  predefined?: boolean;
}

export const useAllAvailableTokens = (account: string, chainId: string) => {
  const tokens = useAccountTokens(account, chainId);
  const allTokensStored = useAllTokensSelector();

  return useMemo(() => {
    const remainedTokens: AccountToken[] = [];
    const removedSlugs: string[] = [];

    for (const token of tokens) {
      if (token.status === 'removed') removedSlugs.push(token.slug);
      else remainedTokens.push(token);
    }

    const otherAccountsTokens: AccountToken[] = [];
    for (const [key, record] of Object.entries(allTokensStored)) {
      if (isAccountAssetsStoreKeyOfSameChainIdAndDifferentAccount(key, account, chainId))
        for (const [slug, asset] of Object.entries(record)) {
          if (asset.status !== 'removed' && !removedSlugs.includes(slug))
            otherAccountsTokens.push({ slug, status: 'disabled' });
        }
    }

    // Keep this order to preserve correct statuses & flags
    const concatenated = remainedTokens.concat(otherAccountsTokens);

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
  const storedRaw = useAccountTokensSelector(account, chainId);
  const whitelistSlugs = useWhitelistSlugs(chainId);

  const balances = useAllAccountBalancesSelector(account, chainId);

  return useMemoWithCompare<AccountToken[]>(
    () => {
      // 1. Stored
      const stored = Object.entries(storedRaw).map<AccountToken>(([slug, { status }]) => ({
        slug,
        status: getAssetStatus(balances[slug], status)
      }));

      // 2. Predefined
      const predefinedMetadata = PREDEFINED_TOKENS_METADATA[chainId];

      const predefined = predefinedMetadata
        ? predefinedMetadata.map<AccountToken>(metadata => {
            const slug = tokenToSlug(metadata);
            const storedStatus = storedRaw[slug]?.status;
            const status = isAssetStatusIdle(storedStatus) ? 'enabled' : storedStatus;

            return { slug, status, predefined: true };
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

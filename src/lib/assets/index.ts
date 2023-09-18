import { useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { useAccountTokensSelector } from 'app/store/assets/selectors';
import { StorredToken } from 'app/store/assets/state';
import { useBalancesSelector } from 'app/store/balances/selectors';
import type { AssetMetadataBase } from 'lib/metadata';
import { useAccount, useChainId } from 'lib/temple/front';

import { PREDEFINED_TOKENS_METADATA } from './known-tokens';
import { Asset, FA2Token } from './types';

export const TEZ_TOKEN_SLUG = 'tez' as const;
export const TEMPLE_TOKEN_SLUG = 'KT1VaEsVNiBoA56eToEK6n6BcPgh1tdx9eXi_0';

export const toTokenSlug = (contract: string, id: BigNumber.Value = 0) => {
  return `${contract}_${new BigNumber(id).toFixed()}`;
};

export const tokenToSlug = <T extends { address: string; id?: BigNumber.Value }>({ address, id }: T) => {
  return toTokenSlug(address, id);
};

export const isFA2Token = (asset: Asset): asset is FA2Token =>
  isTezAsset(asset) ? false : typeof asset.id !== 'undefined';

export const isTezAsset = (asset: Asset | string): asset is typeof TEZ_TOKEN_SLUG => asset === TEZ_TOKEN_SLUG;

export const toPenny = (metadata: AssetMetadataBase | nullish) => new BigNumber(1).div(10 ** (metadata?.decimals ?? 0));

export interface AccountToken extends Pick<StorredToken, 'status'> {
  slug: string;
  // decimals: number;
}

export const useAccountTokens = (account: string, chainId: string): AccountToken[] => {
  const stored = useAccountTokensSelector(account, chainId);

  const tokens = useMemo(() => {
    const predefined = PREDEFINED_TOKENS_METADATA[chainId];
    if (!predefined) return stored;

    const reduced = predefined.reduce<AccountToken[]>((acc, curr) => {
      const slug = tokenToSlug(curr);
      if (stored.some(t => t.slug === slug)) return acc;

      return acc.concat({ slug });
    }, []);

    return reduced.length ? reduced.concat(stored) : stored;
  }, [stored, chainId]);

  return tokens;
};

export const useDisplayedAccountTokens = () => {
  const chainId = useChainId(true)!;
  const { publicKeyHash } = useAccount();

  const tokens = useAccountTokens(publicKeyHash, chainId);
  const balances = useBalancesSelector(publicKeyHash, chainId);

  return useMemo(
    () => tokens.filter(({ slug, status }) => status === 'enabled' || (!status && Number(balances[slug]) > 0)),
    [tokens, balances]
  );
};

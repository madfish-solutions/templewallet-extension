import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Token } from '@lifi/sdk';

import { dispatch } from 'app/store';
import {
  putLifiEvmTokensMetadataAction,
  putLifiEvmTokensMetadataLoadingAction
} from 'app/store/evm/swap-lifi-metadata/actions';
import { TokenSlugTokenMetadataRecord } from 'app/store/evm/swap-lifi-metadata/state';
import { getEvmSwapTokensMetadata, TokensByChain } from 'lib/apis/temple/endpoints/evm';
import { ChainID, LifiSupportedChains } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { useEvmAccountTokens } from 'lib/assets/hooks/tokens';
import { toTokenSlug } from 'lib/assets/utils';
import { EVM_ZERO_ADDRESS } from 'lib/constants';
import { EvmAssetStandard } from 'lib/evm/types';
import { LIFI_METADATA_SYNC_INTERVAL } from 'lib/fixed-times';
import { useEnabledEvmChains } from 'temple/front';

/**
 * Hook to fetch and provide available EVM tokens for swap operations
 */
export const useLifiEvmTokensSlugs = (publicKeyHash: HexString) => {
  const [lifiEvmTokensByChain, setLifiEvmTokensByChain] = useState<TokensByChain>({});
  const lastFetchTimeRef = useRef<number>(0);

  const enabledChains = useEnabledEvmChains();
  const enabledLifiSupportedChains = useMemo(
    () => enabledChains.filter(chain => LifiSupportedChains.includes(chain.chainId)),
    [enabledChains]
  );

  const fetchEvmTokens = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchTimeRef.current < LIFI_METADATA_SYNC_INTERVAL) {
      return;
    }

    lastFetchTimeRef.current = now;

    try {
      dispatch(putLifiEvmTokensMetadataLoadingAction({ isLoading: true, error: null }));
      const tokens = await getEvmSwapTokensMetadata(
        enabledLifiSupportedChains.map(chain => chain.chainId) as ChainID[]
      );
      setLifiEvmTokensByChain(tokens || {});
    } catch (err) {
      console.error('Failed to fetch EVM tokens:', err);
      dispatch(
        putLifiEvmTokensMetadataLoadingAction({
          isLoading: false,
          error: err instanceof Error ? err : new Error('Failed to fetch EVM tokens')
        })
      );
      setLifiEvmTokensByChain({});
    } finally {
      dispatch(putLifiEvmTokensMetadataLoadingAction({ isLoading: false }));
    }
  }, [enabledLifiSupportedChains]);

  useEffect(() => void fetchEvmTokens(), [fetchEvmTokens]);

  const existingTokens = useEvmAccountTokens(publicKeyHash);

  const existingSlugMap: { [chainId: number]: Set<string> } = {};
  for (const { slug, chainId } of existingTokens) {
    const address = slug.split('_')[0];
    if (!existingSlugMap[chainId as number]) existingSlugMap[chainId as number] = new Set();
    existingSlugMap[chainId as number].add(address);
  }

  const filteredTokensByChain: TokensByChain = {};
  for (const [chainIdStr, tokens] of Object.entries(lifiEvmTokensByChain)) {
    const chainId = Number(chainIdStr);
    const existingAddresses = existingSlugMap[chainId] || new Set();

    filteredTokensByChain[chainId] = tokens.filter((token: Token) => {
      const addr = token.address;
      return addr && addr !== EVM_ZERO_ADDRESS && !existingAddresses.has(addr);
    });
  }

  useEffect(() => {
    Object.entries(filteredTokensByChain).forEach(([chainId, chainTokens]) => {
      const records: TokenSlugTokenMetadataRecord = {};

      chainTokens.forEach((token: Token) => {
        const tokenSlug = toTokenSlug(token.address, 0);
        records[tokenSlug] = {
          address: token.address as HexString,
          standard: EvmAssetStandard.ERC20,
          name: token.name,
          symbol: token.symbol,
          decimals: token.decimals,
          logoURI: token.logoURI,
          priceUSD: token.priceUSD
        };
      });

      dispatch(
        putLifiEvmTokensMetadataAction({
          chainId: Number(chainId),
          records: records
        })
      );
    });
  }, [filteredTokensByChain]);
};

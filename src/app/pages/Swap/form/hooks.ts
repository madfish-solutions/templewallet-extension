import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Token } from '@lifi/sdk';

import { dispatch } from 'app/store';
import {
  putLifiEvmTokensMetadataAction,
  putLifiEvmTokensMetadataLoadingAction,
  setLifiMetadataLastFetchTimeAction
} from 'app/store/evm/swap-lifi-metadata/actions';
import { useLifiEvmMetadataLastFetchTimeSelector } from 'app/store/evm/swap-lifi-metadata/selectors';
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
export const useFetchLifiEvmTokensSlugs = (publicKeyHash: HexString) => {
  const [lifiEvmTokensByChain, setLifiEvmTokensByChain] = useState<TokensByChain>({});
  const lastFetchTime = useLifiEvmMetadataLastFetchTimeSelector();

  const enabledChains = useEnabledEvmChains();
  const enabledLifiSupportedChains = useMemo(
    () => enabledChains.filter(chain => LifiSupportedChains.includes(chain.chainId)),
    [enabledChains]
  );

  const prevEnabledLifiSupportedChainsRef = useRef<typeof enabledLifiSupportedChains>();

  const fetchEvmTokens = useCallback(async () => {
    const chainsChanged =
      JSON.stringify(prevEnabledLifiSupportedChainsRef.current) !== JSON.stringify(enabledLifiSupportedChains);

    if (!chainsChanged && Date.now() - (lastFetchTime ?? 0) < LIFI_METADATA_SYNC_INTERVAL) {
      return;
    }

    dispatch(setLifiMetadataLastFetchTimeAction(Date.now()));

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
  }, [enabledLifiSupportedChains, lastFetchTime]);

  useEffect(() => {
    void fetchEvmTokens();
    prevEnabledLifiSupportedChainsRef.current = enabledLifiSupportedChains;
  }, [fetchEvmTokens, enabledLifiSupportedChains]);

  const existingTokens = useEvmAccountTokens(publicKeyHash);

  const existingSlugMap = useMemo(() => {
    const map: { [chainId: number]: Set<string> } = {};
    for (const { slug, chainId, status } of existingTokens) {
      if (status !== 'enabled') continue;
      const address = slug.split('_')[0];
      if (!map[chainId as number]) {
        map[chainId as number] = new Set();
      }
      map[chainId as number].add(address);
    }
    return map;
  }, [existingTokens]);

  const filteredTokensByChain: TokensByChain = useMemo(() => {
    const result: TokensByChain = {};

    for (const [chainIdStr, tokens] of Object.entries(lifiEvmTokensByChain)) {
      const chainId = Number(chainIdStr);
      const existingAddresses = existingSlugMap[chainId] || new Set();

      result[chainId] = tokens.filter((token: Token) => {
        const addr = token.address;
        return addr && addr !== EVM_ZERO_ADDRESS && !existingAddresses.has(addr);
      });
    }

    return result;
  }, [lifiEvmTokensByChain, existingSlugMap]);

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

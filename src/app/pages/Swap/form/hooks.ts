import { useCallback, useEffect, useMemo, useState } from 'react';

import { Token } from '@lifi/sdk';

import { ETHERLINK_CHAIN_ID } from 'app/pages/Swap/constants';
import { dispatch } from 'app/store';
import {
  putLifiEvmTokensMetadataAction,
  putLifiEvmTokensMetadataLoadingAction,
  putLifiSupportedChainIdsAction,
  setLifiMetadataLastFetchTimeAction
} from 'app/store/evm/swap-lifi-metadata/actions';
import { useLifiEvmMetadataLastFetchTimeSelector } from 'app/store/evm/swap-lifi-metadata/selectors';
import { TokenSlugTokenMetadataRecord } from 'app/store/evm/swap-lifi-metadata/state';
import { getEvmSwapConnectionsMetadata, getLifiSupportedChains, TokensByChain } from 'lib/apis/temple/endpoints/evm';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { toChainAssetSlug, toTokenSlug } from 'lib/assets/utils';
import { EVM_ZERO_ADDRESS } from 'lib/constants';
import { EvmAssetStandard } from 'lib/evm/types';
import { LIFI_SUPPORTED_CHAIN_IDS_INTERVAL } from 'lib/fixed-times';
import { useEnabledEvmChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

const EXCLUDED_CHAIN_IDS = [ETHERLINK_CHAIN_ID];

export const useFetchSupportedLifiChainIds = () => {
  const lastFetchTime = useLifiEvmMetadataLastFetchTimeSelector();

  const fetchLifiSupportedChainIds = useCallback(async () => {
    if (Date.now() - (lastFetchTime ?? 0) < LIFI_SUPPORTED_CHAIN_IDS_INTERVAL) {
      return;
    }

    dispatch(setLifiMetadataLastFetchTimeAction(Date.now()));

    try {
      let chainIds = await getLifiSupportedChains();
      chainIds = chainIds.filter(id => !EXCLUDED_CHAIN_IDS.includes(id));

      dispatch(putLifiSupportedChainIdsAction(chainIds));
    } catch (err) {
      console.error('Failed to fetch LIFI supported chains:', err);
    }
  }, [lastFetchTime]);

  useEffect(() => void fetchLifiSupportedChainIds(), [fetchLifiSupportedChainIds]);
};

export const useFetchLifiEvmTokensSlugs = ({ fromChain, fromToken }: { fromChain: number; fromToken: string }) => {
  const [lifiEvmConnections, setLifiEvmConnections] = useState<TokensByChain>({});

  const enabledChains = useEnabledEvmChains();

  const fetchEvmTokens = useCallback(async () => {
    try {
      dispatch(putLifiEvmTokensMetadataLoadingAction({ isLoading: true, error: null }));
      const tokens = await getEvmSwapConnectionsMetadata(fromChain, fromToken);
      setLifiEvmConnections(tokens || {});
    } catch (err) {
      console.error('Failed to fetch EVM connections:', err);
      setLifiEvmConnections({});
    } finally {
      dispatch(putLifiEvmTokensMetadataLoadingAction({ isLoading: false }));
    }
  }, [fromChain, fromToken]);

  useEffect(() => void fetchEvmTokens(), [fetchEvmTokens]);

  useEffect(() => {
    if (Object.keys(lifiEvmConnections).length === 0) {
      enabledChains.forEach(chain => {
        if (EXCLUDED_CHAIN_IDS.includes(chain.chainId)) return;

        dispatch(
          putLifiEvmTokensMetadataAction({
            chainId: chain.chainId,
            records: {}
          })
        );
      });
    }
  }, [lifiEvmConnections, enabledChains]);

  const filteredTokensByChain: TokensByChain = useMemo(() => {
    const result: TokensByChain = {};
    const enabledChainIds = new Set(enabledChains.map(chain => chain.chainId));

    for (const [chainIdStr, tokens] of Object.entries(lifiEvmConnections)) {
      const chainId = Number(chainIdStr);

      if (!enabledChainIds.has(chainId)) continue;
      if (EXCLUDED_CHAIN_IDS.includes(chainId)) continue;

      const existingAddresses = new Set();

      result[chainId] = tokens.filter((token: Token) => {
        const addr = token.address;
        const isDuplicate = existingAddresses.has(addr);
        const isValid = addr && !isDuplicate;

        if (isValid) existingAddresses.add(addr);
        return isValid;
      });
    }

    return result;
  }, [lifiEvmConnections, enabledChains]);

  useEffect(() => {
    Object.entries(filteredTokensByChain).forEach(([chainIdStr, chainTokens]) => {
      const chainId = Number(chainIdStr);
      const records: TokenSlugTokenMetadataRecord = {};

      chainTokens.forEach((token: Token) => {
        const isNative = token.address === EVM_ZERO_ADDRESS;

        const tokenSlug = isNative
          ? toChainAssetSlug(TempleChainKind.EVM, chainId, EVM_TOKEN_SLUG)
          : toTokenSlug(token.address, 0);

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
          chainId,
          records
        })
      );
    });
  }, [filteredTokensByChain]);
};

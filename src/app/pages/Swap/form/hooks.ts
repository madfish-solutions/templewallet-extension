import { useCallback, useEffect, useMemo, useState } from 'react';

import { Token } from '@lifi/sdk';

import { dispatch } from 'app/store';
import {
  put3RouteEvmTokensMetadataLoadingAction,
  putRoute3EvmTokensMetadataAction,
  set3RouteEvmMetadataLastFetchTimeAction
} from 'app/store/evm/swap-3route-metadata/actions';
import {
  putLifiEvmTokensMetadataAction,
  putLifiEvmTokensMetadataLoadingAction,
  putLifiSupportedChainIdsAction,
  setLifiMetadataLastFetchTimeAction
} from 'app/store/evm/swap-lifi-metadata/actions';
import { useLifiEvmMetadataLastFetchTimeSelector } from 'app/store/evm/swap-lifi-metadata/selectors';
import { TokenSlugTokenMetadataRecord } from 'app/store/evm/swap-lifi-metadata/state';
import {
  get3RouteEvmTokens,
  getEvmSwapConnectionsMetadata,
  getLifiSupportedChains,
  TokensByChain
} from 'lib/apis/temple/endpoints/evm';
import { Route3EvmTokenWithPrice } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { toChainAssetSlug, toTokenSlug } from 'lib/assets/utils';
import { EVM_ZERO_ADDRESS } from 'lib/constants';
import { equalsIgnoreCase } from 'lib/evm/on-chain/utils/common.utils';
import { EvmAssetStandard } from 'lib/evm/types';
import { LIFI_SUPPORTED_CHAIN_IDS_INTERVAL } from 'lib/fixed-times';
import { ETHERLINK_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useEnabledEvmChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

interface FetchTokensSlugsPayload {
  fromChain: number;
  fromToken: string;
}

export const useFetchSupportedLifiChainIds = () => {
  const lastFetchTime = useLifiEvmMetadataLastFetchTimeSelector();

  const fetchLifiSupportedChainIds = useCallback(async () => {
    if (Date.now() - (lastFetchTime ?? 0) < LIFI_SUPPORTED_CHAIN_IDS_INTERVAL) {
      return;
    }

    dispatch(setLifiMetadataLastFetchTimeAction(Date.now()));

    try {
      dispatch(putLifiSupportedChainIdsAction(await getLifiSupportedChains()));
    } catch (err) {
      console.error('Failed to fetch LIFI supported chains:', err);
    }
  }, [lastFetchTime]);

  useEffect(() => void fetchLifiSupportedChainIds(), [fetchLifiSupportedChainIds]);
};

export const useFetchLifiEvmTokensSlugs = ({ fromChain, fromToken }: FetchTokensSlugsPayload) => {
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

export const useFetch3RouteEvmTokensSlugs = ({ fromChain, fromToken }: FetchTokensSlugsPayload) => {
  const [route3EvmTokens, setRoute3EvmTokens] = useState<Record<number, StringRecord<Route3EvmTokenWithPrice>>>({});

  const enabledChains = useEnabledEvmChains();

  const fetchEvmTokens = useCallback(async () => {
    if (fromChain !== ETHERLINK_MAINNET_CHAIN_ID) {
      dispatch(put3RouteEvmTokensMetadataLoadingAction({ isLoading: false, error: null }));

      return;
    }

    try {
      dispatch(put3RouteEvmTokensMetadataLoadingAction({ isLoading: true, error: null }));
      setRoute3EvmTokens({ [fromChain]: await get3RouteEvmTokens() });
      dispatch(set3RouteEvmMetadataLastFetchTimeAction(Date.now()));
    } catch (err) {
      console.error('Failed to fetch 3Route EVM tokens:', err);
      setRoute3EvmTokens({});
    } finally {
      dispatch(put3RouteEvmTokensMetadataLoadingAction({ isLoading: false }));
    }
  }, [fromChain]);

  useEffect(() => void fetchEvmTokens(), [fetchEvmTokens]);

  useEffect(() => {
    if (Object.keys(route3EvmTokens).length === 0) {
      enabledChains.forEach(({ chainId }) => dispatch(putRoute3EvmTokensMetadataAction({ chainId, records: {} })));
    }
  }, [route3EvmTokens, enabledChains]);

  const filteredTokensByChain = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(route3EvmTokens).filter(([chainIdStr]) =>
          enabledChains.some(chain => chain.chainId === Number(chainIdStr))
        )
      ),
    [route3EvmTokens, enabledChains]
  );

  useEffect(() => {
    if (!filteredTokensByChain[ETHERLINK_MAINNET_CHAIN_ID]) {
      return;
    }

    dispatch(
      putRoute3EvmTokensMetadataAction({
        chainId: ETHERLINK_MAINNET_CHAIN_ID,
        records: Object.fromEntries(
          Object.entries(filteredTokensByChain[ETHERLINK_MAINNET_CHAIN_ID])
            .filter(([address]) => !equalsIgnoreCase(address, fromToken))
            .map(([address, token]) => {
              return [
                address === EVM_ZERO_ADDRESS
                  ? toChainAssetSlug(TempleChainKind.EVM, ETHERLINK_MAINNET_CHAIN_ID, EVM_TOKEN_SLUG)
                  : toTokenSlug(address, 0),
                { ...token, standard: EvmAssetStandard.ERC20 }
              ] as const;
            })
        )
      })
    );
  }, [filteredTokensByChain, fromToken]);
};

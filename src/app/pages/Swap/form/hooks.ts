import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Token } from '@lifi/sdk';
import { intersection } from 'lodash';

import { dispatch } from 'app/store';
import {
  put3RouteEvmTokensMetadataLoadingAction,
  putRoute3EvmTokensMetadataAction,
  set3RouteEvmMetadataLastFetchTimeAction
} from 'app/store/evm/swap-3route-metadata/actions';
import {
  putLifiConnectedEvmTokensMetadataAction,
  putLifiEnabledNetworksEvmTokensCatalogueAction,
  putLifiEvmTokensMetadataLoadingAction
} from 'app/store/evm/swap-lifi-metadata/actions';
import {
  useLifiCatalogueFetchedAtSelector,
  useLifiEnabledNetworksEvmTokensMetadataRecordSelector,
  useLifiSupportedChainIdsSelector
} from 'app/store/evm/swap-lifi-metadata/selectors';
import { TokenSlugTokenMetadataRecord } from 'app/store/evm/swap-lifi-metadata/state';
import {
  get3RouteEvmTokens,
  getEvmSwapConnectionsMetadata,
  getLifiSwapTokens,
  TokensByChain
} from 'lib/apis/temple/endpoints/evm';
import { Route3EvmTokenWithPrice } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { toChainAssetSlug, toTokenSlug } from 'lib/assets/utils';
import { EVM_ZERO_ADDRESS } from 'lib/constants';
import { EvmAssetStandard } from 'lib/evm/types';
import { LIFI_TOKENS_CATALOGUE_SYNC_INTERVAL } from 'lib/fixed-times';
import { ETHERLINK_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useInterval, useUpdatableRef } from 'lib/ui/hooks';
import { equalsIgnoreCase } from 'lib/utils';
import { EvmChain, useEnabledEvmChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

interface FetchTokensSlugsPayload {
  fromChain: number;
  fromToken: string;
}

export const useLifiTokensMetadataSync = () => {
  const supportedChainIds = useLifiSupportedChainIdsSelector();
  const enabledChains = useEnabledEvmChains();
  const catalogue = useLifiEnabledNetworksEvmTokensMetadataRecordSelector();
  const catalogueFetchedAt = useLifiCatalogueFetchedAtSelector();
  const chainsToSync = useMemo(
    () =>
      intersection(
        supportedChainIds,
        enabledChains.map(({ chainId }) => chainId)
      ),
    [supportedChainIds, enabledChains]
  );
  const chainsToSyncKey = chainsToSync.join(',');

  const catalogueRef = useUpdatableRef(catalogue);
  const catalogueFetchedAtRef = useUpdatableRef(catalogueFetchedAt);
  const enabledChainsRef = useUpdatableRef(enabledChains);
  const requestIdRef = useRef(0);

  useInterval(
    async () => {
      if (!chainsToSyncKey) return;

      const chainIds = chainsToSyncKey.split(',').map(Number);
      const storedCatalogue = catalogueRef.current;
      const fetchedAt = catalogueFetchedAtRef.current;
      const hasNewChain = chainIds.some(chainId => storedCatalogue[chainId] == null);
      const isStale = fetchedAt == null || Date.now() - fetchedAt >= LIFI_TOKENS_CATALOGUE_SYNC_INTERVAL;

      if (!isStale && !hasNewChain) return;

      const requestId = ++requestIdRef.current;

      try {
        const tokensByChain = normalizeTokensByChain(await getLifiSwapTokens(chainIds), enabledChainsRef.current);
        if (requestId !== requestIdRef.current) return;

        dispatch(
          putLifiEnabledNetworksEvmTokensCatalogueAction({
            recordsByChainId: buildCatalogueRecords(chainIds, tokensByChain),
            timestamp: Date.now()
          })
        );
      } catch (err) {
        console.error('Failed to fetch LiFi swap tokens:', err);
      }
    },
    [chainsToSyncKey, catalogueRef, catalogueFetchedAtRef, enabledChainsRef, requestIdRef],
    LIFI_TOKENS_CATALOGUE_SYNC_INTERVAL,
    true
  );
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
          putLifiConnectedEvmTokensMetadataAction({
            chainId: chain.chainId,
            records: {}
          })
        );
      });
    }
  }, [lifiEvmConnections, enabledChains]);

  const filteredTokensByChain = useMemo(
    () => normalizeTokensByChain(lifiEvmConnections, enabledChains),
    [lifiEvmConnections, enabledChains]
  );

  useEffect(() => {
    handleTokensByChain(filteredTokensByChain, (chainId, records) => {
      dispatch(
        putLifiConnectedEvmTokensMetadataAction({
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

const normalizeTokensByChain = (tokens: TokensByChain, enabledChains: EvmChain[]) => {
  const result: TokensByChain = {};
  const enabledChainIds = new Set(enabledChains.map(chain => chain.chainId));

  for (const [chainIdStr, chainTokens] of Object.entries(tokens)) {
    const chainId = Number(chainIdStr);

    if (!enabledChainIds.has(chainId)) continue;

    const existingAddresses = new Set();

    result[chainId] = chainTokens.filter((token: Token) => {
      const addr = token.address;
      const isDuplicate = existingAddresses.has(addr);
      const isValid = addr && !isDuplicate;

      if (isValid) existingAddresses.add(addr);
      return isValid;
    });
  }

  return result;
};

const buildCatalogueRecords = (chainIds: number[], tokensByChain: TokensByChain) => {
  const recordsByChainId: Record<number, TokenSlugTokenMetadataRecord> = {};

  for (const chainId of chainIds) {
    recordsByChainId[chainId] = {};
  }

  handleTokensByChain(tokensByChain, (chainId, records) => {
    recordsByChainId[chainId] = records;
  });

  return recordsByChainId;
};

const handleTokensByChain = (
  tokensByChain: TokensByChain,
  callback: (chainId: number, records: TokenSlugTokenMetadataRecord) => void
) => {
  Object.entries(tokensByChain).forEach(([chainIdStr, chainTokens]) => {
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

    callback(chainId, records);
  });
};

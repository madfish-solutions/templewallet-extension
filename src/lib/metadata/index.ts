import { useCallback, useEffect, useRef } from 'react';

import { dispatch } from 'app/store';
import {
  useEvmCollectibleMetadataSelector,
  useEvmChainCollectiblesMetadataRecordSelector,
  useEvmCollectiblesMetadataRecordSelector
} from 'app/store/evm/collectibles-metadata/selectors';
import {
  useEvmTokenMetadataSelector,
  useEvmChainTokensMetadataRecordSelector,
  useEvmTokensMetadataRecordSelector
} from 'app/store/evm/tokens-metadata/selectors';
import { loadCollectiblesMetadataAction } from 'app/store/tezos/collectibles-metadata/actions';
import {
  useAllCollectiblesMetadataSelector,
  useCollectibleMetadataSelector,
  useCollectiblesMetadataLoadingSelector
} from 'app/store/tezos/collectibles-metadata/selectors';
import { loadTokensMetadataAction } from 'app/store/tezos/tokens-metadata/actions';
import {
  useTokenMetadataSelector,
  useTokensMetadataLoadingSelector,
  useAllTokensMetadataSelector
} from 'app/store/tezos/tokens-metadata/selectors';
import { METADATA_API_LOAD_CHUNK_SIZE } from 'lib/apis/temple';
import { isTezAsset } from 'lib/assets';
import { fromChainAssetSlug } from 'lib/assets/utils';
import { isTruthy } from 'lib/utils';
import { isEvmNativeTokenSlug } from 'lib/utils/evm.utils';
import { useAllEvmChains, useAllTezosChains } from 'temple/front';
import { useEvmChainByChainId } from 'temple/front/chains';
import { isTezosDcpChainId } from 'temple/networks';

import { TEZOS_METADATA, FILM_METADATA } from './defaults';
import {
  AssetMetadataBase,
  EvmAssetMetadataBase,
  EvmCollectibleMetadata,
  EvmNativeTokenMetadata,
  EvmTokenMetadata,
  TokenMetadata
} from './types';

export type { AssetMetadataBase, TokenMetadata } from './types';
export { isCollectible, isTezosCollectibleMetadata, getAssetSymbol, getTokenName } from './utils';

export { TEZOS_METADATA };

export const getTezosGasMetadata = (chainId: string) => (isTezosDcpChainId(chainId) ? FILM_METADATA : TEZOS_METADATA);

export const useTezosAssetMetadata = (slug: string, tezosChainId: string): AssetMetadataBase | undefined => {
  const tokenMetadata = useTokenMetadataSelector(slug);
  const collectibleMetadata = useCollectibleMetadataSelector(slug);

  return isTezAsset(slug) ? getTezosGasMetadata(tezosChainId) : tokenMetadata || collectibleMetadata;
};

export const useEvmAssetMetadata = (slug: string, evmChainId: number): EvmAssetMetadataBase | undefined => {
  const network = useEvmChainByChainId(evmChainId);
  const tokenMetadata = useEvmTokenMetadataSelector(evmChainId, slug);
  const collectibleMetadata = useEvmCollectibleMetadataSelector(evmChainId, slug);

  return isEvmNativeTokenSlug(slug) ? network?.currency : tokenMetadata || collectibleMetadata;
};

export const useGetEvmChainAssetMetadata = (chainId: number) => {
  const network = useEvmChainByChainId(chainId);
  const tokensMetadatas = useEvmChainTokensMetadataRecordSelector(chainId);
  const collectiblesMetadatas = useEvmChainCollectiblesMetadataRecordSelector(chainId);

  return useCallback<EvmAssetMetadataGetter>(
    (slug: string) => {
      if (isEvmNativeTokenSlug(slug)) return network?.currency;

      return tokensMetadatas[slug] || collectiblesMetadatas[slug];
    },
    [tokensMetadatas, collectiblesMetadatas, network]
  );
};

export const useGetEvmAssetMetadata = () => {
  const allEvmChains = useAllEvmChains();
  const tokensMetadatas = useEvmTokensMetadataRecordSelector();
  const collectiblesMetadatas = useEvmCollectiblesMetadataRecordSelector();

  return useCallback(
    (slug: string, chainId: number) => {
      if (isEvmNativeTokenSlug(slug)) return allEvmChains[chainId]?.currency;

      return tokensMetadatas[chainId]?.[slug] || collectiblesMetadatas[chainId]?.[slug];
    },
    [tokensMetadatas, collectiblesMetadatas, allEvmChains]
  );
};

export type EvmAssetMetadataGetter = (
  slug: string
) => EvmNativeTokenMetadata | EvmTokenMetadata | EvmCollectibleMetadata | undefined;

type TokenMetadataGetter = (slug: string) => TokenMetadata | undefined;

export const useGetTokenMetadata = () => {
  const allMeta = useAllTokensMetadataSelector();

  return useCallback<TokenMetadataGetter>(slug => allMeta[slug], [allMeta]);
};

export const useGetChainTokenOrGasMetadata = (tezosChainId: string) => {
  const getTokenMetadata = useGetTokenMetadata();

  return useCallback(
    (slug: string): AssetMetadataBase | undefined =>
      isTezAsset(slug) ? getTezosGasMetadata(tezosChainId) : getTokenMetadata(slug),
    [getTokenMetadata, tezosChainId]
  );
};

export const useGetTokenOrGasMetadata = () => {
  const getTokenMetadata = useGetTokenMetadata();

  return useCallback(
    (chainId: string, slug: string): AssetMetadataBase | undefined =>
      isTezAsset(slug) ? getTezosGasMetadata(chainId) : getTokenMetadata(slug),
    [getTokenMetadata]
  );
};

export const useGetCollectibleMetadata = () => {
  const allMeta = useAllCollectiblesMetadataSelector();

  return useCallback<TokenMetadataGetter>(slug => allMeta.get(slug), [allMeta]);
};

export const useGetAssetMetadata = (tezosChainId: string) => {
  const getTokenOrGasMetadata = useGetChainTokenOrGasMetadata(tezosChainId);
  const getCollectibleMetadata = useGetCollectibleMetadata();

  return useCallback(
    (slug: string) => getTokenOrGasMetadata(slug) || getCollectibleMetadata(slug),
    [getTokenOrGasMetadata, getCollectibleMetadata]
  );
};

/**
 * @param slugsToCheck // Memoize
 */
export const useTezosTokensMetadataPresenceCheck = (rpcBaseURL: string, slugsToCheck?: string[]) => {
  const metadataLoading = useTokensMetadataLoadingSelector();
  const getMetadata = useGetTokenMetadata();

  useTezosChainAssetsMetadataPresenceCheck(rpcBaseURL, false, metadataLoading, getMetadata, slugsToCheck);
};

/**
 * @param slugsToCheck // Memoize
 */
export const useTezosChainCollectiblesMetadataPresenceCheck = (rpcBaseURL: string, slugsToCheck?: string[]) => {
  const metadataLoading = useCollectiblesMetadataLoadingSelector();
  const getMetadata = useGetCollectibleMetadata();

  useTezosChainAssetsMetadataPresenceCheck(rpcBaseURL, true, metadataLoading, getMetadata, slugsToCheck);
};

export const useTezosCollectiblesMetadataPresenceCheck = (chainSlugsToCheck?: string[]) => {
  const metadataLoading = useCollectiblesMetadataLoadingSelector();
  const getMetadata = useGetCollectibleMetadata();

  useTezosAssetsMetadataPresenceCheck(true, metadataLoading, getMetadata, chainSlugsToCheck);
};

const useTezosChainAssetsMetadataPresenceCheck = (
  rpcBaseURL: string,
  ofCollectibles: boolean,
  metadataLoading: boolean,
  getMetadata: TokenMetadataGetter,
  slugsToCheck?: string[]
) => {
  const checkedRef = useRef<string[]>([]);

  useEffect(() => {
    if (metadataLoading || !slugsToCheck?.length) return;

    const missingChunk = slugsToCheck
      .filter(
        slug =>
          !isTezAsset(slug) &&
          !isTruthy(getMetadata(slug)) &&
          // In case fetched metadata is `null` & won't save
          !checkedRef.current.includes(slug)
      )
      .slice(0, METADATA_API_LOAD_CHUNK_SIZE);

    if (missingChunk.length > 0) {
      checkedRef.current = [...checkedRef.current, ...missingChunk];

      dispatch(
        (ofCollectibles ? loadCollectiblesMetadataAction : loadTokensMetadataAction)({
          rpcUrl: rpcBaseURL,
          slugs: missingChunk
        })
      );
    }
  }, [ofCollectibles, slugsToCheck, getMetadata, metadataLoading, rpcBaseURL]);
};

const useTezosAssetsMetadataPresenceCheck = (
  ofCollectibles: boolean,
  metadataLoading: boolean,
  getMetadata: TokenMetadataGetter,
  chainSlugsToCheck?: string[]
) => {
  const tezosChains = useAllTezosChains();

  const checkedRef = useRef<string[]>([]);

  useEffect(() => {
    if (metadataLoading || !chainSlugsToCheck?.length) return;

    const missingChunk = chainSlugsToCheck
      .filter(chainSlug => {
        const [_, _2, slug] = fromChainAssetSlug<string>(chainSlug);

        return (
          !isTezAsset(slug) &&
          !isTruthy(getMetadata(slug)) &&
          // In case fetched metadata is `null` & won't save
          !checkedRef.current.includes(slug)
        );
      })
      .slice(0, METADATA_API_LOAD_CHUNK_SIZE);

    if (missingChunk.length > 0) {
      checkedRef.current = [...checkedRef.current, ...missingChunk];

      const chainIdToMissingSlugsRecord = missingChunk.reduce<Record<string, string[]>>((acc, chainSlug) => {
        const [_, chainId, slug] = fromChainAssetSlug<string>(chainSlug);

        if (acc[chainId]) acc[chainId].push(slug);
        else acc[chainId] = [slug];

        return acc;
      }, {});

      for (const chainId of Object.keys(chainIdToMissingSlugsRecord)) {
        const rpcBaseURL = tezosChains[chainId]?.rpcBaseURL;

        if (!rpcBaseURL) continue;

        dispatch(
          (ofCollectibles ? loadCollectiblesMetadataAction : loadTokensMetadataAction)({
            rpcUrl: rpcBaseURL,
            slugs: chainIdToMissingSlugsRecord[chainId]
          })
        );
      }
    }
  }, [ofCollectibles, getMetadata, metadataLoading, chainSlugsToCheck, tezosChains]);
};

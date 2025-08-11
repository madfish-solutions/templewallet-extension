import { useCallback, useEffect, useRef } from 'react';

import { merge } from 'lodash';

import { dispatch } from 'app/store';
import {
  useEvmCollectibleMetadataSelector,
  useEvmChainCollectiblesMetadataRecordSelector,
  useEvmCollectiblesMetadataRecordSelector
} from 'app/store/evm/collectibles-metadata/selectors';
import { EvmCollectibleMetadataRecord } from 'app/store/evm/collectibles-metadata/state';
import { loadNoCategoryEvmAssetsMetadataActions } from 'app/store/evm/no-category-assets-metadata/actions';
import {
  useEvmChainNoCategoryAssetsMetadataSelector,
  useEvmNoCategoryAssetMetadataSelector,
  useEvmNoCategoryAssetsMetadataLoadingSelector,
  useEvmNoCategoryAssetsMetadataRecordSelector
} from 'app/store/evm/no-category-assets-metadata/selectors';
import { EvmNoCategoryAssetMetadataRecord } from 'app/store/evm/no-category-assets-metadata/state';
import {
  useEvmCollectiblesMetadataLoadingSelector,
  useEvmTokensMetadataLoadingSelector
} from 'app/store/evm/selectors';
import {
  useLifiEvmChainTokensMetadataSelector,
  useLifiEvmTokensMetadataRecordSelector
} from 'app/store/evm/swap-lifi-metadata/selectors';
import { LifiEvmTokenMetadataRecord } from 'app/store/evm/swap-lifi-metadata/state';
import {
  useEvmTokenMetadataSelector,
  useEvmChainTokensMetadataRecordSelector,
  useEvmTokensMetadataRecordSelector
} from 'app/store/evm/tokens-metadata/selectors';
import { EvmTokenMetadataRecord } from 'app/store/evm/tokens-metadata/state';
import { loadCollectiblesMetadataAction } from 'app/store/tezos/collectibles-metadata/actions';
import {
  useAllCollectiblesMetadataSelector,
  useCollectibleMetadataSelector,
  useCollectiblesMetadataLoadingSelector
} from 'app/store/tezos/collectibles-metadata/selectors';
import { loadNoCategoryTezosAssetsMetadataAction } from 'app/store/tezos/no-category-assets-metadata/actions';
import {
  useAllNoCategoryTezosAssetsMetadataSelector,
  useNoCategoryTezosAssetMetadataSelector,
  useNoCategoryTezosAssetsMetadataLoadingSelector
} from 'app/store/tezos/no-category-assets-metadata/selectors';
import { loadTokensMetadataAction } from 'app/store/tezos/tokens-metadata/actions';
import {
  useTokenMetadataSelector,
  useTokensMetadataLoadingSelector,
  useAllTokensMetadataSelector
} from 'app/store/tezos/tokens-metadata/selectors';
import { METADATA_API_LOAD_CHUNK_SIZE } from 'lib/apis/temple';
import { isTezAsset } from 'lib/assets';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { useUpdatableRef } from 'lib/ui/hooks';
import { isTruthy } from 'lib/utils';
import { isEvmNativeTokenSlug } from 'lib/utils/evm.utils';
import { useAllEvmChains, useAllTezosChains } from 'temple/front';
import { EvmChain, TezosChain, useEvmChainByChainId } from 'temple/front/chains';
import { isTezosDcpChainId } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

import { TEZOS_METADATA, FILM_METADATA } from './defaults';
import {
  AssetMetadataBase,
  EvmAssetMetadata,
  EvmCollectibleMetadata,
  EvmNativeTokenMetadata,
  EvmTokenMetadata,
  TokenMetadata
} from './types';

export type { AssetMetadataBase, TokenMetadata } from './types';
export { isCollectible, isTezosCollectibleMetadata, getAssetSymbol, getTokenName } from './utils';

export { TEZOS_METADATA };

export const useGetTezosGasMetadata = () => {
  const allTezosChains = useAllTezosChains();

  return useCallback(
    (chainId: string) => {
      const metadataBase = isTezosDcpChainId(chainId) ? FILM_METADATA : TEZOS_METADATA;
      const currencySymbolFromChain = allTezosChains[chainId]?.currencySymbol;

      return { ...metadataBase, symbol: currencySymbolFromChain ?? metadataBase.symbol };
    },
    [allTezosChains]
  );
};

export const useTezosGasMetadata = (chainId: string) => {
  const getTezosGasMetadata = useGetTezosGasMetadata();

  return getTezosGasMetadata(chainId);
};

export const useEvmGasMetadata = (chainId: number) => useEvmTokenMetadataSelector(chainId, EVM_TOKEN_SLUG);

export const useCategorizedTezosAssetMetadata = (slug: string, tezosChainId: string): AssetMetadataBase | undefined => {
  const tokenMetadata = useTokenMetadataSelector(slug);
  const collectibleMetadata = useCollectibleMetadataSelector(slug);
  const getTezosGasMetadata = useGetTezosGasMetadata();

  return isTezAsset(slug) ? getTezosGasMetadata(tezosChainId) : tokenMetadata || collectibleMetadata;
};

export const useGenericTezosAssetMetadata = (slug: string, tezosChainId: string): AssetMetadataBase | undefined => {
  const categorizedMetadata = useCategorizedTezosAssetMetadata(slug, tezosChainId);
  const noCategoryMetadata = useNoCategoryTezosAssetMetadataSelector(slug);

  return categorizedMetadata || noCategoryMetadata;
};

export const useEvmCategorizedAssetMetadata = (slug: string, evmChainId: number): EvmAssetMetadata | undefined => {
  const network = useEvmChainByChainId(evmChainId);
  const tokenMetadata = useEvmTokenMetadataSelector(evmChainId, slug);
  const collectibleMetadata = useEvmCollectibleMetadataSelector(evmChainId, slug);

  return isEvmNativeTokenSlug(slug) ? network?.currency : tokenMetadata || collectibleMetadata;
};

export const useEvmGenericAssetMetadata = (slug: string, evmChainId: number): EvmAssetMetadata | undefined => {
  const categorizedAssetMetadata = useEvmCategorizedAssetMetadata(slug, evmChainId);
  const noCategoryAssetMetadata = useEvmNoCategoryAssetMetadataSelector(evmChainId, slug);

  return categorizedAssetMetadata || noCategoryAssetMetadata;
};

const useGetter = <Input, Args extends unknown[], Output>(
  input: Input,
  getterFn: (input: Input, ...args: Args) => Output
) => {
  const inputRef = useUpdatableRef(input);

  return useCallback((...args: Args) => getterFn(inputRef.current, ...args), [inputRef, getterFn]);
};

type GetterBySlugInput<T> = StringRecord<T> | Map<string, T> | undefined;
const useGetterBySlug = <T>(input: GetterBySlugInput<T>, fallbackValueFn?: SyncFn<string, T | undefined>) => {
  const getterFn = useCallback(
    (input: GetterBySlugInput<T>, slug: string) =>
      input instanceof Map ? input.get(slug) : input?.[slug] ?? fallbackValueFn?.(slug),
    [fallbackValueFn]
  );

  return useGetter(input, getterFn);
};

export const useGetEvmGasOrTokenMetadata = () => {
  const evmChains = useAllEvmChains();
  const tokensMetadata = useEvmTokensMetadataRecordSelector();
  const lifiMetadata = useLifiEvmTokensMetadataRecordSelector();
  const getterFn = useCallback(
    (input: EvmTokenMetadataRecord, chainId: number, slug: string) =>
      isEvmNativeTokenSlug(slug) ? evmChains[chainId]?.currency : input[chainId]?.[slug],
    [evmChains]
  );
  const mergedMetadata = merge({}, tokensMetadata, lifiMetadata);

  return useGetter(mergedMetadata, getterFn);
};

export const useGetEvmChainTokenOrGasMetadata = (chainId: number) => {
  const network = useEvmChainByChainId(chainId);
  const tokensMetadata = useEvmChainTokensMetadataRecordSelector(chainId);
  const { metadata: lifiTokensMetadata } = useLifiEvmChainTokensMetadataSelector(chainId);
  const fallbackValueFn = useCallback(
    (slug: string) => (isEvmNativeTokenSlug(slug) ? network?.currency : undefined),
    [network]
  );

  return useGetterBySlug<EvmNativeTokenMetadata | EvmTokenMetadata>(
    { ...tokensMetadata, ...lifiTokensMetadata },
    fallbackValueFn
  );
};

export const useGetEvmNoCategoryAssetMetadata = (chainId: number) => {
  const tokensMetadatas = useEvmChainNoCategoryAssetsMetadataSelector(chainId);

  return useGetterBySlug(tokensMetadatas);
};

interface EvmGenericAssetMetadataGetterInput {
  tokensMetadatas: EvmTokenMetadataRecord;
  collectiblesMetadatas: EvmCollectibleMetadataRecord;
  noCategoryMetadatas: EvmNoCategoryAssetMetadataRecord;
  lifiMetadata: LifiEvmTokenMetadataRecord;
}

const useGetEvmGenericAssetMetadata = () => {
  const allEvmChains = useAllEvmChains();
  const tokensMetadatas = useEvmTokensMetadataRecordSelector();
  const collectiblesMetadatas = useEvmCollectiblesMetadataRecordSelector();
  const noCategoryMetadatas = useEvmNoCategoryAssetsMetadataRecordSelector();
  const lifiMetadata = useLifiEvmTokensMetadataRecordSelector();

  const getterFn = useCallback(
    (input: EvmGenericAssetMetadataGetterInput, slug: string, chainId: number) => {
      if (isEvmNativeTokenSlug(slug)) return allEvmChains[chainId]?.currency;

      return (
        input.tokensMetadatas[chainId]?.[slug] ||
        input.collectiblesMetadatas[chainId]?.[slug] ||
        input.noCategoryMetadatas[chainId]?.[slug] ||
        input.lifiMetadata[chainId]?.[slug]
      );
    },
    [allEvmChains]
  );

  return useGetter({ tokensMetadatas, collectiblesMetadatas, noCategoryMetadatas, lifiMetadata }, getterFn);
};

export const useGetEvmChainCollectibleMetadata = (chainId: number) => {
  const collectiblesMetadatas = useEvmChainCollectiblesMetadataRecordSelector(chainId);

  return useGetterBySlug(collectiblesMetadatas);
};

export const useGetEvmChainAssetMetadata = (chainId: number) => {
  const getTokenOrGasMetadata = useGetEvmChainTokenOrGasMetadata(chainId);
  const getCollectibleMetadata = useGetEvmChainCollectibleMetadata(chainId);

  return useCallback<EvmAssetMetadataGetter>(
    (slug: string) => getTokenOrGasMetadata(slug) || getCollectibleMetadata(slug),
    [getTokenOrGasMetadata, getCollectibleMetadata]
  );
};

type EvmAssetMetadataGetter = (
  slug: string
) => EvmNativeTokenMetadata | EvmTokenMetadata | EvmCollectibleMetadata | undefined;

type TokenMetadataGetter = (slug: string) => TokenMetadata | undefined;

export const useGetTokenMetadata = () => {
  const allMeta = useAllTokensMetadataSelector();

  return useGetterBySlug(allMeta);
};

export const useGetChainTokenOrGasMetadata = (tezosChainId: string) => {
  const getTokenMetadata = useGetTokenMetadata();
  const getTezosGasMetadata = useGetTezosGasMetadata();

  return useCallback(
    (slug: string): AssetMetadataBase | undefined =>
      isTezAsset(slug) ? getTezosGasMetadata(tezosChainId) : getTokenMetadata(slug),
    [getTezosGasMetadata, getTokenMetadata, tezosChainId]
  );
};

export const useGetTokenOrGasMetadata = () => {
  const getTokenMetadata = useGetTokenMetadata();
  const getTezosGasMetadata = useGetTezosGasMetadata();

  return useCallback(
    (chainId: string, slug: string): AssetMetadataBase | undefined =>
      isTezAsset(slug) ? getTezosGasMetadata(chainId) : getTokenMetadata(slug),
    [getTezosGasMetadata, getTokenMetadata]
  );
};

export const useGetCollectibleMetadata = () => {
  const allMeta = useAllCollectiblesMetadataSelector();

  return useGetterBySlug(allMeta);
};

export const useGetNoCategoryAssetMetadata = () => {
  const allMeta = useAllNoCategoryTezosAssetsMetadataSelector();

  return useGetterBySlug(allMeta);
};

export const useGetCategorizedAssetMetadata = (tezosChainId: string) => {
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

export const useTezosGenericAssetsMetadataLoading = () => {
  const tokensMetadataLoading = useTokensMetadataLoadingSelector();
  const collectiblesMetadataLoading = useCollectiblesMetadataLoadingSelector();
  const noCategoryAssetsMetadataLoading = useNoCategoryTezosAssetsMetadataLoadingSelector();

  return tokensMetadataLoading || collectiblesMetadataLoading || noCategoryAssetsMetadataLoading;
};

export const useTezosGenericAssetsMetadataCheck = (chainSlugsToCheck?: string[], associatedAccountPkh?: string) => {
  const loading = useTezosGenericAssetsMetadataLoading();
  const getCollectibleMetadata = useGetCollectibleMetadata();
  const getTokenMetadata = useGetTokenMetadata();
  const getNoCategoryAssetMetadata = useGetNoCategoryAssetMetadata();

  const getAssetMetadata = useCallback<TokenMetadataGetter>(
    slug => getCollectibleMetadata(slug) || getTokenMetadata(slug) || getNoCategoryAssetMetadata(slug),
    [getCollectibleMetadata, getNoCategoryAssetMetadata, getTokenMetadata]
  );

  useTezosAssetsMetadataPresenceCheck(undefined, loading, getAssetMetadata, chainSlugsToCheck, associatedAccountPkh);
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

const handleMissingSlugs = <T extends TezosChain | EvmChain>(
  chainSlugs: string[],
  chains: StringRecord<T>,
  initSlugsLoading: (rpcBaseURL: string, chainId: string, slugs: string[]) => void
) => {
  const chainIdToMissingSlugsRecord = chainSlugs.reduce<StringRecord<string[]>>((acc, chainSlug) => {
    const [_, chainId, slug] = parseChainAssetSlug(chainSlug);

    if (acc[chainId]) acc[chainId].push(slug);
    else acc[chainId] = [slug];

    return acc;
  }, {});

  Object.keys(chainIdToMissingSlugsRecord).forEach(chainId => {
    const rpcBaseURL = chains[chainId]?.rpcBaseURL;

    if (rpcBaseURL) {
      initSlugsLoading(rpcBaseURL, chainId, chainIdToMissingSlugsRecord[chainId]);
    }
  });
};

const useTezosAssetsMetadataPresenceCheck = (
  ofCollectibles: boolean | undefined,
  metadataLoading: boolean,
  getMetadata: TokenMetadataGetter,
  chainSlugsToCheck?: string[],
  associatedAccountPkh = ''
) => {
  const tezosChains = useAllTezosChains();

  const checkedRef = useRef(new Set<string>());

  useEffect(() => {
    if (metadataLoading || !chainSlugsToCheck?.length) return;

    const missingChunk = chainSlugsToCheck
      .filter(chainSlug => {
        const [_, _2, slug] = parseChainAssetSlug(chainSlug, TempleChainKind.Tezos);

        return (
          !isTezAsset(slug) &&
          !isTruthy(getMetadata(slug)) &&
          // In case fetched metadata is `null` & won't save
          !checkedRef.current.has(chainSlug)
        );
      })
      .slice(0, METADATA_API_LOAD_CHUNK_SIZE);

    if (missingChunk.length > 0) {
      missingChunk.forEach(slug => checkedRef.current.add(slug));

      handleMissingSlugs(missingChunk, tezosChains, (rpcUrl, chainId, slugs) => {
        if (ofCollectibles === undefined) {
          dispatch(
            loadNoCategoryTezosAssetsMetadataAction({
              rpcUrl,
              slugs,
              associatedAccountPkh,
              chainId
            })
          );
        } else {
          dispatch((ofCollectibles ? loadCollectiblesMetadataAction : loadTokensMetadataAction)({ rpcUrl, slugs }));
        }
      });
    }
  }, [ofCollectibles, getMetadata, metadataLoading, chainSlugsToCheck, tezosChains, associatedAccountPkh]);
};

export const useEvmGenericAssetsMetadataLoading = () => {
  const tokensMetadataLoading = useEvmTokensMetadataLoadingSelector();
  const collectiblesMetadataLoading = useEvmCollectiblesMetadataLoadingSelector();
  const noCategoryAssetsMetadataLoading = useEvmNoCategoryAssetsMetadataLoadingSelector();

  return tokensMetadataLoading || collectiblesMetadataLoading || noCategoryAssetsMetadataLoading;
};

export const useEvmGenericAssetsMetadataCheck = (
  chainSlugsToCheck?: string[],
  associatedAccountPkh: HexString = '0x'
) => {
  const evmChains = useAllEvmChains();
  const metadataLoading = useEvmGenericAssetsMetadataLoading();
  const getMetadata = useGetEvmGenericAssetMetadata();

  const checkedRef = useRef(new Set<string>());

  useEffect(() => {
    if (metadataLoading || !chainSlugsToCheck?.length) return;

    const missingSlugs = chainSlugsToCheck.filter(chainSlug => {
      const [_, chainId, slug] = parseChainAssetSlug(chainSlug, TempleChainKind.EVM);

      return !isEvmNativeTokenSlug(slug) && !getMetadata(slug, chainId) && !checkedRef.current.has(chainSlug);
    });

    if (missingSlugs.length === 0) {
      return;
    }

    missingSlugs.forEach(slug => checkedRef.current.add(slug));

    handleMissingSlugs(missingSlugs, evmChains, (rpcUrl, chainId, slugs) => {
      dispatch(
        loadNoCategoryEvmAssetsMetadataActions.submit({ rpcUrl, associatedAccountPkh, chainId: Number(chainId), slugs })
      );
    });
  }, [associatedAccountPkh, chainSlugsToCheck, evmChains, getMetadata, metadataLoading]);
};

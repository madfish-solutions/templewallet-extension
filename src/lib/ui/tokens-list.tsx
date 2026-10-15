import { Ref, RefObject } from 'react';

import { clamp } from 'lodash';

import {
  useEvmChainCollectiblesMetadataRecordSelector,
  useEvmCollectiblesMetadataRecordSelector
} from 'app/store/evm/collectibles-metadata/selectors';
import {
  useEvmChainNoCategoryAssetsMetadataSelector,
  useEvmNoCategoryAssetsMetadataRecordSelector
} from 'app/store/evm/no-category-assets-metadata/selectors';
import {
  use3RouteEvmChainTokensMetadataSelector,
  use3RouteEvmTokensMetadataRecordSelector
} from 'app/store/evm/swap-3route-metadata/selectors';
import {
  useLifiConnectedEvmChainTokensMetadataSelector,
  useLifiConnectedEvmTokensMetadataRecordSelector,
  useLifiEnabledNetworksEvmChainTokensMetadataSelector,
  useLifiEnabledNetworksEvmTokensMetadataRecordSelector
} from 'app/store/evm/swap-lifi-metadata/selectors';
import {
  useEvmChainTokensMetadataRecordSelector,
  useEvmTokensMetadataRecordSelector
} from 'app/store/evm/tokens-metadata/selectors';
import { useSelector } from 'app/store/root-state.selector';
import { usePartnersPromotionModule } from 'app/templates/partners-promotion';
import { useAdsConstantsModule } from 'lib/ads-constants';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { AccountToken } from 'lib/assets/hooks/tokens';
import { parseChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import type { EvmAssetMetadata } from 'lib/metadata/types';
import { isEvmCollectible } from 'lib/metadata/utils';
import { ChainGroupedSlugs, EvmChain, TezosChain } from 'temple/front/chains';
import { DEFAULT_EVM_CURRENCY, StoredEvmNetwork, StoredTezosNetwork } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

export type TokenListItemElement = HTMLDivElement | HTMLAnchorElement;

const findRenderedSlugIndex = (
  slugs: string[],
  tokenWillBeRendered: (slug: string) => boolean,
  renderedIndex: number
) => {
  let toRenderLeft = renderedIndex + 1;

  for (let i = 0; i < slugs.length; i++) {
    if (tokenWillBeRendered(slugs[i])) toRenderLeft--;

    if (toRenderLeft === 0) return i;
  }

  return slugs.length - 1;
};

export const getTokenElementIndex = (
  promoElement: HTMLDivElement | null,
  firstListItemElement: TokenListItemElement | null,
  chainSlugs: string[],
  tokenWillBeRendered: (chainSlug: string) => boolean,
  y: number,
  takeTopOffset = true
) => {
  const topOffset = takeTopOffset ? (firstListItemElement?.offsetTop ?? 0) : 0;
  const yAfterOffset = y - topOffset;
  const promoHeight = promoElement?.clientHeight ?? 64;
  const tokenElementHeight = firstListItemElement?.clientHeight ?? 56;
  const allTokensRenderedIndexWithoutPromo = clamp(
    Math.floor(yAfterOffset / tokenElementHeight),
    0,
    chainSlugs.length - 1
  );
  let allTokensRenderedIndex: number;

  if (!promoElement || allTokensRenderedIndexWithoutPromo < 1) {
    allTokensRenderedIndex = allTokensRenderedIndexWithoutPromo;
  } else {
    const contentPromoAndAboveHeight = promoHeight + tokenElementHeight;
    allTokensRenderedIndex =
      yAfterOffset < contentPromoAndAboveHeight
        ? 0
        : 1 + Math.floor((yAfterOffset - contentPromoAndAboveHeight) / tokenElementHeight);
  }

  return [findRenderedSlugIndex(chainSlugs, tokenWillBeRendered, allTokensRenderedIndex)];
};

const getGroupedTokenElementIndex = <T extends TempleChainKind>(
  promoElement: HTMLDivElement | null,
  firstListItemElement: TokenListItemElement | null,
  firstHeaderElement: HTMLDivElement | null,
  groupedSlugs: ChainGroupedSlugs<T>,
  tokenWillBeRendered: (chainSlug: string) => boolean,
  y: number
) => {
  const topOffset = firstHeaderElement?.offsetTop ?? 0;
  let slugsInPreviousGroupsCount = 0;
  let yLeft = y - topOffset;
  const promoHeight = promoElement?.clientHeight ?? 64;
  const tokenElementHeight = firstListItemElement?.clientHeight ?? 56;
  const firstHeaderHeight = firstHeaderElement?.clientHeight ?? 26;
  for (let i = 0; i < groupedSlugs.length; i++) {
    const groupSlugsCount = groupedSlugs[i][1].length;
    const renderedSlugsCount = groupedSlugs[i][1].filter(tokenWillBeRendered).length;
    const headerWithMarginsHeight = i === 0 ? firstHeaderHeight : Math.round((firstHeaderHeight * 20) / 13);
    const groupHeightWithoutPromo = headerWithMarginsHeight + tokenElementHeight * renderedSlugsCount;
    const groupPromoHeight = i === 0 && promoElement ? promoHeight : 0;
    const groupHeight = groupHeightWithoutPromo + groupPromoHeight;

    if (groupHeight < yLeft) {
      slugsInPreviousGroupsCount += groupSlugsCount;
      yLeft -= groupHeight;
      continue;
    }

    if (yLeft < headerWithMarginsHeight) {
      return [slugsInPreviousGroupsCount];
    }

    yLeft -= headerWithMarginsHeight;
    const renderedIndexWithoutPromo = clamp(Math.floor(yLeft / tokenElementHeight), 0, groupSlugsCount - 1);
    let renderedIndex: number;

    if (!groupPromoHeight || renderedIndexWithoutPromo < 1) {
      renderedIndex = renderedIndexWithoutPromo;
    } else {
      const contentPromoAndAboveHeight = groupPromoHeight + tokenElementHeight;
      renderedIndex =
        yLeft < contentPromoAndAboveHeight
          ? 0
          : 1 + Math.floor((yLeft - contentPromoAndAboveHeight) / tokenElementHeight);
    }

    return [slugsInPreviousGroupsCount + findRenderedSlugIndex(groupedSlugs[i][1], tokenWillBeRendered, renderedIndex)];
  }

  return [slugsInPreviousGroupsCount - 1];
};

type EvmMetadataSlugRecord = StringRecord<unknown> | undefined;

const evmTokenWillRender = (
  assetSlug: string,
  tokens: EvmMetadataSlugRecord,
  lifiConnected: EvmMetadataSlugRecord,
  lifiEnabled: EvmMetadataSlugRecord,
  route3: EvmMetadataSlugRecord,
  collectibles: EvmMetadataSlugRecord,
  noCategory: StringRecord<EvmAssetMetadata> | undefined
) => {
  if (assetSlug === EVM_TOKEN_SLUG) return true;

  if (tokens?.[assetSlug] || lifiConnected?.[assetSlug] || lifiEnabled?.[assetSlug] || route3?.[assetSlug]) return true;

  if (collectibles?.[assetSlug]) return false;

  const noCategoryMetadata = noCategory?.[assetSlug];

  return Boolean(noCategoryMetadata) && !isEvmCollectible(noCategoryMetadata);
};

export const useTokenWillBeRendered = () => {
  const lifiConnected = useLifiConnectedEvmTokensMetadataRecordSelector();
  const lifiEnabled = useLifiEnabledNetworksEvmTokensMetadataRecordSelector();
  const route3 = use3RouteEvmTokensMetadataRecordSelector();
  const tokens = useEvmTokensMetadataRecordSelector();
  const collectibles = useEvmCollectiblesMetadataRecordSelector();
  const noCategory = useEvmNoCategoryAssetsMetadataRecordSelector();

  return (chainSlug: string) => {
    const [chainKind, chainId, assetSlug] = parseChainAssetSlug(chainSlug);

    if (chainKind === TempleChainKind.Tezos) return true;

    const evmChainId = Number(chainId);

    return evmTokenWillRender(
      assetSlug,
      tokens[evmChainId],
      lifiConnected[evmChainId],
      lifiEnabled[evmChainId],
      route3[evmChainId],
      collectibles[evmChainId],
      noCategory[evmChainId]
    );
  };
};

export const useEvmChainTokenWillBeRendered = (chainId: number) => {
  const lifiConnected = useLifiConnectedEvmChainTokensMetadataSelector(chainId);
  const lifiEnabled = useLifiEnabledNetworksEvmChainTokensMetadataSelector(chainId);
  const route3 = use3RouteEvmChainTokensMetadataSelector(chainId);
  const tokens = useEvmChainTokensMetadataRecordSelector(chainId);
  const collectibles = useEvmChainCollectiblesMetadataRecordSelector(chainId);
  const noCategory = useEvmChainNoCategoryAssetsMetadataSelector(chainId);

  return (tokenSlug: string) =>
    evmTokenWillRender(tokenSlug, tokens, lifiConnected, lifiEnabled, route3, collectibles, noCategory);
};

export const useEvmTokenListItemWillRender = (chainId: number, assetSlug: string) =>
  useSelector(
    ({
      evmTokensMetadata,
      lifiEvmTokensMetadata,
      route3EvmTokensMetadata,
      evmCollectiblesMetadata,
      evmNoCategoryAssetMetadata
    }) =>
      evmTokenWillRender(
        assetSlug,
        evmTokensMetadata.metadataRecord[chainId],
        lifiEvmTokensMetadata.connectedTokensMetadataRecord[chainId],
        lifiEvmTokensMetadata.enabledChainsTokensMetadataRecord[chainId],
        route3EvmTokensMetadata.metadataRecord[chainId],
        evmCollectiblesMetadata.metadataRecord[chainId],
        evmNoCategoryAssetMetadata.metadataRecord[chainId]
      )
  );

export function makeFallbackChain(network: StoredTezosNetwork): TezosChain;
export function makeFallbackChain(network: StoredEvmNetwork): EvmChain;
export function makeFallbackChain(network: StoredEvmNetwork | StoredTezosNetwork): EvmChain | TezosChain {
  const { name, rpcBaseURL } = network;
  const commonProps = {
    name,
    rpcBaseURL,
    allBlockExplorers: [],
    default: true
  };

  if (network.chain === TempleChainKind.EVM) {
    const { chain, chainId } = network;

    return { ...commonProps, rpc: network, allRpcs: [network], kind: chain, chainId, currency: DEFAULT_EVM_CURRENCY };
  }

  const { chain, chainId } = network;

  return { ...commonProps, rpc: network, allRpcs: [network], kind: chain, chainId };
}

export const useRenderPromo = (manageActive: boolean, page: 'home' | 'tokens', promoRef?: Ref<HTMLDivElement>) => {
  const PartnersPromotionModule = usePartnersPromotionModule();
  const AdsConstantsModule = useAdsConstantsModule();
  const id = page === 'home' ? 'promo-token-item' : 'promo-token-item-tokens';

  return () =>
    manageActive || !PartnersPromotionModule || !AdsConstantsModule ? null : (
      <PartnersPromotionModule.PartnersPromotion
        id={id}
        key={id}
        variant={PartnersPromotionModule.PartnersPromotionVariant.Text}
        pageName={page === 'home' ? AdsConstantsModule.HOME_PAGE_NAME : AdsConstantsModule.TOKENS_PAGE_NAME}
        ref={promoRef}
      />
    );
};

export const toNotRemovedChainTokensSlugs = (tokens: AccountToken[], chainKind: TempleChainKind) =>
  tokens
    .filter(({ status }) => status !== 'removed')
    .map(({ chainId, slug }) => toChainAssetSlug(chainKind, chainId, slug));

export const useGroupableGetTokenElementIndex = (
  groupedSlugs: ChainGroupedSlugs | null,
  slugs: string[],
  promoRef: RefObject<HTMLDivElement | null>,
  firstListItemRef: RefObject<TokenListItemElement | null>,
  firstHeaderRef: RefObject<HTMLDivElement | null>
) => {
  const tokenWillBeRendered = useTokenWillBeRendered();

  return (y: number) =>
    groupedSlugs
      ? getGroupedTokenElementIndex(
          promoRef.current,
          firstListItemRef.current,
          firstHeaderRef.current,
          groupedSlugs,
          tokenWillBeRendered,
          y
        )
      : getTokenElementIndex(promoRef.current, firstListItemRef.current, slugs, tokenWillBeRendered, y);
};

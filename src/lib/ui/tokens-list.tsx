import { Ref, RefObject } from 'react';

import { clamp } from 'lodash';

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
import { usePartnersPromotionModule } from 'app/templates/partners-promotion';
import { useAdsConstantsModule } from 'lib/ads-constants';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { AccountToken } from 'lib/assets/hooks/tokens';
import { parseChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { ChainGroupedSlugs, EvmChain, TezosChain } from 'temple/front/chains';
import { DEFAULT_EVM_CURRENCY, StoredEvmNetwork, StoredTezosNetwork } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

export type TokenListItemElement = HTMLDivElement | HTMLAnchorElement;

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

  let tokensToRenderLeft = allTokensRenderedIndex + 1;
  for (let i = 0; i < chainSlugs.length; i++) {
    if (tokenWillBeRendered(chainSlugs[i])) {
      tokensToRenderLeft--;
    }

    if (tokensToRenderLeft === 0) {
      return [i];
    }
  }

  return [chainSlugs.length - 1];
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
    const indexWithoutPromo = clamp(Math.floor(yLeft / tokenElementHeight), 0, groupSlugsCount - 1);

    if (!promoElement || indexWithoutPromo < 1) {
      return [indexWithoutPromo + slugsInPreviousGroupsCount];
    }

    const contentPromoAndAboveHeight = groupPromoHeight + tokenElementHeight;

    if (yLeft < contentPromoAndAboveHeight) {
      return [slugsInPreviousGroupsCount];
    }

    return [slugsInPreviousGroupsCount + 1 + Math.floor((yLeft - contentPromoAndAboveHeight) / tokenElementHeight)];
  }

  return [slugsInPreviousGroupsCount - 1];
};

export const useTokenWillBeRendered = () => {
  const lifiConnectedEvmTokensMetadataRecord = useLifiConnectedEvmTokensMetadataRecordSelector();
  const lifiEnabledNetworksEvmTokensMetadataRecord = useLifiEnabledNetworksEvmTokensMetadataRecordSelector();
  const route3EvmTokensMetadataRecord = use3RouteEvmTokensMetadataRecordSelector();
  const evmTokensMetadataRecord = useEvmTokensMetadataRecordSelector();

  return (chainSlug: string) => {
    const [chainKind, chainId, assetSlug] = parseChainAssetSlug(chainSlug);

    if (chainKind === TempleChainKind.Tezos || assetSlug === EVM_TOKEN_SLUG) {
      return true;
    }

    const evmChainId = Number(chainId);

    return Boolean(
      lifiConnectedEvmTokensMetadataRecord[evmChainId]?.[assetSlug] ??
      lifiEnabledNetworksEvmTokensMetadataRecord[evmChainId]?.[assetSlug] ??
      route3EvmTokensMetadataRecord[evmChainId]?.[assetSlug] ??
      evmTokensMetadataRecord[evmChainId]?.[assetSlug]
    );
  };
};

export const useEvmChainTokenWillBeRendered = (chain: EvmChain) => {
  const lifiConnectedEvmChainTokensMetadataRecord = useLifiConnectedEvmChainTokensMetadataSelector(chain.chainId);
  const lifiEnabledNetworksEvmChainTokensMetadataRecord = useLifiEnabledNetworksEvmChainTokensMetadataSelector(
    chain.chainId
  );
  const route3EvmChainTokensMetadataRecord = use3RouteEvmChainTokensMetadataSelector(chain.chainId);
  const evmChainTokensMetadataRecord = useEvmChainTokensMetadataRecordSelector(chain.chainId);

  return (tokenSlug: string) => {
    return Boolean(
      lifiConnectedEvmChainTokensMetadataRecord?.[tokenSlug] ??
      lifiEnabledNetworksEvmChainTokensMetadataRecord?.[tokenSlug] ??
      route3EvmChainTokensMetadataRecord?.[tokenSlug] ??
      evmChainTokensMetadataRecord?.[tokenSlug]
    );
  };
};

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

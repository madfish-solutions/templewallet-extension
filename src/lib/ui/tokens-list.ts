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
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { ChainGroupedSlugs, EvmChain } from 'temple/front/chains';
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

export const getGroupedTokenElementIndex = <T extends TempleChainKind>(
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

import { Fragment, ReactNode, Ref, RefObject } from 'react';

import clsx from 'clsx';
import { clamp } from 'lodash';

import { AccountToken } from 'lib/assets/hooks/tokens';
import { toChainAssetSlug } from 'lib/assets/utils';
import { ChainGroupedSlugs, EvmChain, TezosChain } from 'temple/front/chains';
import { DEFAULT_EVM_CURRENCY, StoredEvmNetwork, StoredTezosNetwork } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

export type TokenListItemElement = HTMLDivElement | HTMLAnchorElement;

export const makeGetTokenElementIndexFunction =
  (
    promoRef: RefObject<HTMLDivElement | null> | null,
    firstListItemRef: RefObject<TokenListItemElement | null>,
    slugsCount: number,
    takeTopOffset = true
  ) =>
  (y: number) => {
    const topOffset = takeTopOffset ? (firstListItemRef.current?.offsetTop ?? 0) : 0;
    const yAfterOffset = y - topOffset;
    const promoElement = promoRef?.current;
    const promoHeight = promoElement?.clientHeight ?? 64;
    const tokenElementHeight = firstListItemRef.current?.clientHeight ?? 56;
    const indexWithoutPromo = clamp(Math.floor(yAfterOffset / tokenElementHeight), 0, slugsCount - 1);

    if (!promoElement || indexWithoutPromo < 1) {
      return [indexWithoutPromo];
    }

    const contentPromoAndAboveHeight = promoHeight + tokenElementHeight;

    if (yAfterOffset < contentPromoAndAboveHeight) {
      return [0];
    }

    return [1 + Math.floor((yAfterOffset - contentPromoAndAboveHeight) / tokenElementHeight)];
  };

export const makeGroupedTokenElementIndexFunction =
  <T extends TempleChainKind>(
    promoRef: RefObject<HTMLDivElement | null>,
    firstListItemRef: RefObject<TokenListItemElement | null>,
    firstHeaderRef: RefObject<HTMLDivElement | null>,
    groupedSlugs: ChainGroupedSlugs<T>
  ) =>
  (y: number) => {
    const topOffset = firstHeaderRef.current?.offsetTop ?? 0;
    let slugsInPreviousGroupsCount = 0;
    let yLeft = y - topOffset;
    const promoElement = promoRef.current;
    const promoHeight = promoElement?.clientHeight ?? 64;
    const tokenElementHeight = firstListItemRef.current?.clientHeight ?? 56;
    const firstHeaderHeight = firstHeaderRef.current?.clientHeight ?? 26;
    for (let i = 0; i < groupedSlugs.length; i++) {
      const groupSlugsCount = groupedSlugs[i][1].length;
      const headerWithMarginsHeight = i === 0 ? firstHeaderHeight : Math.round((firstHeaderHeight * 20) / 13);
      const groupHeightWithoutPromo = headerWithMarginsHeight + tokenElementHeight * groupSlugsCount;
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

export const getTokensViewWithPromo = (tokensJsx: ReactNode[], promoJsx: ReactNode, slugsCount = tokensJsx.length) => {
  if (!promoJsx) return tokensJsx;

  if (slugsCount <= 1) {
    tokensJsx.push(promoJsx);
  } else {
    tokensJsx.splice(1, 0, promoJsx);
  }

  return tokensJsx;
};

interface GroupedTokensViewWithPromoRenderProps {
  groupedSlugs: ChainGroupedSlugs;
  evmChains?: StringRecord<EvmChain>;
  tezosChains?: StringRecord<TezosChain>;
  promoJsx: ReactNode;
  firstListItemRef: Ref<TokenListItemElement>;
  firstHeaderRef: Ref<HTMLDivElement>;
  buildTokensJsxArray: (
    slugs: string[],
    firstListItemRef: Ref<TokenListItemElement>,
    indexShift: number
  ) => ReactNode[];
}

export const getGroupedTokensViewWithPromo = ({
  groupedSlugs,
  evmChains = {},
  tezosChains = {},
  promoJsx,
  firstListItemRef,
  firstHeaderRef,
  buildTokensJsxArray
}: GroupedTokensViewWithPromoRenderProps) => {
  let indexShift = 0;

  return groupedSlugs.map(([chainId, chainSlugs], gi) => {
    const tokensJsx = buildTokensJsxArray(chainSlugs, gi === 0 ? firstListItemRef : null, indexShift);
    indexShift += tokensJsx.length;
    const chains = typeof chainId === 'number' ? evmChains : tezosChains;

    return (
      <Fragment key={chainId}>
        <div
          className={clsx('mb-0.5 p-1 text-font-description-bold', gi > 0 && 'mt-4')}
          ref={gi === 0 ? firstHeaderRef : null}
        >
          {chains[chainId]?.name ?? 'Unknown chain'}
        </div>

        {gi > 0 ? tokensJsx : getTokensViewWithPromo(tokensJsx, promoJsx)}
      </Fragment>
    );
  });
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

export const toNotRemovedChainTokensSlugs = (tokens: AccountToken[], chainKind: TempleChainKind) =>
  tokens
    .filter(({ status }) => status !== 'removed')
    .map(({ chainId, slug }) => toChainAssetSlug(chainKind, chainId, slug));

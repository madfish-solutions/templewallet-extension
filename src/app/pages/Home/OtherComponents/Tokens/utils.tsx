import React, { ReactNode, RefObject } from 'react';

import clsx from 'clsx';

import { TokenListItemElement } from 'lib/ui/tokens-list';
import { EvmChain, TezosChain } from 'temple/front';
import { ChainGroupedSlugs } from 'temple/front/chains';
import { DEFAULT_EVM_CURRENCY, StoredEvmNetwork, StoredTezosNetwork } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

export const toExploreAssetLink = (
  isCollectible: boolean,
  chainKind: TempleChainKind,
  chainId: number | string,
  assetSlug: string
) => `/${isCollectible ? 'collectible' : 'token'}/${chainKind}/${chainId}/${assetSlug}`;

export const getTokensViewWithPromo = (tokensJsx: ReactNode[], promoJsx: ReactNode, slugsCount = tokensJsx.length) => {
  if (!promoJsx) return tokensJsx;

  if (slugsCount < 5) {
    tokensJsx.push(promoJsx);
  } else {
    tokensJsx.splice(2, 0, promoJsx);
  }

  return tokensJsx;
};

interface GroupedTokensViewWithPromoRenderProps {
  groupedSlugs: ChainGroupedSlugs;
  evmChains?: StringRecord<EvmChain>;
  tezosChains?: StringRecord<TezosChain>;
  promoJsx: ReactNode;
  firstListItemRef: RefObject<TokenListItemElement>;
  firstHeaderRef: RefObject<HTMLDivElement>;
  buildTokensJsxArray: (
    slugs: string[],
    firstListItemRef: RefObject<TokenListItemElement> | null,
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
      <React.Fragment key={chainId}>
        <div
          className={clsx('mb-0.5 p-1 text-font-description-bold', gi > 0 && 'mt-4')}
          ref={gi === 0 ? firstHeaderRef : null}
        >
          {chains[chainId]?.name ?? 'Unknown chain'}
        </div>

        {gi > 0 ? tokensJsx : getTokensViewWithPromo(tokensJsx, promoJsx)}
      </React.Fragment>
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

import { FC, Fragment } from 'react';

import { stubTrue } from 'lodash';

import { VirtualList } from 'app/atoms/virtual-list';
import { EMPTY_FROZEN_OBJ } from 'lib/utils';
import { EvmChain, TezosChain } from 'temple/front';
import { ChainGroupedSlugs } from 'temple/front/chains';

import { getTokenListItemHeight } from './token-list-item';

export type TokenListItemFC = FC<{ slug: string }>;

// pt-4 + p-1 around a 1rem line + pb-0.5 = 2.625rem: the spacing of every group header but the first
const groupHeaderHeight = (rem: number) => 2.625 * rem;

type VirtualTokensListItem = { type: 'token'; slug: string } | { type: 'header'; key: string; name: string };

const toTokenItem = (slug: string): VirtualTokensListItem => ({ type: 'token', slug });
const itemHeight = (item: VirtualTokensListItem, rem: number) =>
  item.type === 'token' ? getTokenListItemHeight(rem) : groupHeaderHeight(rem);
const itemKey = (item: VirtualTokensListItem) => (item.type === 'token' ? item.slug : item.key);

interface VirtualTokensViewProps {
  slugs: string[];
  groupedSlugs?: ChainGroupedSlugs | null;
  evmChains?: StringRecord<EvmChain>;
  tezosChains?: StringRecord<TezosChain>;
  tokenWillBeRendered?: (slug: string) => boolean;
  Promo: FC;
  TokenListItem: TokenListItemFC;
}

export const VirtualTokensView: FC<VirtualTokensViewProps> = ({
  slugs,
  groupedSlugs,
  evmChains = EMPTY_FROZEN_OBJ,
  tezosChains = EMPTY_FROZEN_OBJ,
  tokenWillBeRendered = stubTrue,
  Promo,
  TokenListItem
}) => {
  const getChainName = (chainId: string | number) =>
    (typeof chainId === 'number' ? evmChains[chainId] : tezosChains[chainId])?.name ?? 'Unknown chain';

  const groups = groupedSlugs?.flatMap(([chainId, chainSlugs]) => {
    const renderedSlugs = chainSlugs.filter(tokenWillBeRendered);

    return renderedSlugs.length > 0 ? [{ chainId, slugs: renderedSlugs }] : [];
  });
  const firstGroup = groups?.at(0);
  const plainSlugs = groups ? [] : slugs.filter(tokenWillBeRendered);
  const firstSlug = firstGroup ? firstGroup.slugs.at(0) : plainSlugs.at(0);

  if (firstSlug === undefined) return null;

  const virtualItems: VirtualTokensListItem[] = groups
    ? groups.flatMap(({ chainId, slugs: groupSlugs }, groupIndex) =>
        groupIndex === 0
          ? groupSlugs.slice(1).map(toTokenItem)
          : [
              { type: 'header' as const, key: `header-${chainId}`, name: getChainName(chainId) },
              ...groupSlugs.map(toTokenItem)
            ]
      )
    : plainSlugs.slice(1).map(toTokenItem);

  const renderItem = (item: VirtualTokensListItem) =>
    item.type === 'token' ? (
      <TokenListItem slug={item.slug} />
    ) : (
      <div className="pt-4 pb-0.5">
        <div className="p-1 text-font-description-bold truncate">{item.name}</div>
      </div>
    );

  // The first row and the promo stay in flow: the promo has no fixed height, so it cannot own a slot
  return (
    <>
      {firstGroup && (
        <div className="mb-0.5 p-1 text-font-description-bold truncate">{getChainName(firstGroup.chainId)}</div>
      )}
      <TokenListItem key={firstSlug} slug={firstSlug} />
      <Promo />
      <VirtualList items={virtualItems} itemHeight={itemHeight} itemKey={itemKey} renderItem={renderItem} />
    </>
  );
};

interface TokensViewWithPromoProps {
  displayedSlugs: string[];
  Promo: FC;
  TokenListItem: TokenListItemFC;
}

export const TokensViewWithPromo: FC<TokensViewWithPromoProps> = ({ displayedSlugs, Promo, TokenListItem }) =>
  displayedSlugs.map((slug, i) => (
    <Fragment key={slug}>
      <TokenListItem slug={slug} />
      {i === 0 ? <Promo /> : null}
    </Fragment>
  ));

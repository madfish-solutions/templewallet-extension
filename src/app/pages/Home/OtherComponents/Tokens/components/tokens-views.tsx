import { FC, Fragment, Ref } from 'react';

import clsx from 'clsx';

import { TokenListItemElement } from 'lib/ui/tokens-list';
import { EMPTY_FROZEN_OBJ } from 'lib/utils';
import { EvmChain, TezosChain } from 'temple/front';
import { ChainGroupedSlugs, OneOfChains } from 'temple/front/chains';

export type TokenListItemFC = FC<{ chainSlug: string; ref?: Ref<TokenListItemElement>; index: number }>;

interface GroupedTokensWithViewPromoProps {
  groupedSlugs: ChainGroupedSlugs;
  evmChains?: StringRecord<EvmChain>;
  tezosChains?: StringRecord<TezosChain>;
  Promo: FC;
  firstListItemRef: Ref<TokenListItemElement>;
  firstHeaderRef: Ref<HTMLDivElement>;
  TokenListItem: TokenListItemFC;
}

export const GroupedTokensViewWithPromo: FC<GroupedTokensWithViewPromoProps> = ({
  groupedSlugs,
  evmChains = EMPTY_FROZEN_OBJ,
  tezosChains = EMPTY_FROZEN_OBJ,
  Promo,
  firstListItemRef,
  firstHeaderRef,
  TokenListItem
}) => {
  let indexShift = 0;

  return groupedSlugs.map(([chainId, chainSlugs], gi) => {
    const prevIndexShift = indexShift;
    indexShift += chainSlugs.length;
    const chain = typeof chainId === 'number' ? evmChains[chainId] : tezosChains[chainId];

    return (
      <TokensGroup
        key={chainId}
        groupIndex={gi}
        chainSlugs={chainSlugs}
        chain={chain}
        Promo={Promo}
        indexShift={prevIndexShift}
        firstListItemRef={firstListItemRef}
        firstHeaderRef={firstHeaderRef}
        TokenListItem={TokenListItem}
      />
    );
  });
};

interface TokensGroupProps {
  groupIndex: number;
  chainSlugs: string[];
  chain?: OneOfChains;
  Promo: FC;
  indexShift: number;
  firstListItemRef: Ref<TokenListItemElement>;
  firstHeaderRef: Ref<HTMLDivElement>;
  TokenListItem: TokenListItemFC;
}

const TokensGroup: FC<TokensGroupProps> = ({
  groupIndex,
  chainSlugs,
  chain,
  Promo,
  indexShift,
  firstListItemRef,
  firstHeaderRef,
  TokenListItem
}) => (
  <>
    <div
      className={clsx('mb-0.5 p-1 text-font-description-bold', groupIndex > 0 && 'mt-4')}
      ref={groupIndex === 0 ? firstHeaderRef : null}
    >
      {chain?.name ?? 'Unknown chain'}
    </div>

    {chainSlugs.map((chainSlug, i) => (
      <Fragment key={chainSlug}>
        <TokenListItem
          chainSlug={chainSlug}
          ref={groupIndex === 0 && i === 0 ? firstListItemRef : undefined}
          index={indexShift + i}
        />
        {i === 0 && groupIndex === 0 ? <Promo /> : null}
      </Fragment>
    ))}
  </>
);

interface TokensViewWithPromoProps {
  displayedSlugs: string[];
  Promo: FC;
  firstListItemRef: Ref<TokenListItemElement>;
  TokenListItem: TokenListItemFC;
}

export const TokensViewWithPromo: FC<TokensViewWithPromoProps> = ({
  displayedSlugs,
  Promo,
  firstListItemRef,
  TokenListItem
}) =>
  displayedSlugs.map((slug, i) => (
    <Fragment key={slug}>
      <TokenListItem chainSlug={slug} ref={i === 0 ? firstListItemRef : undefined} index={i} />
      {i === 0 ? <Promo /> : null}
    </Fragment>
  ));

import { FC, Ref } from 'react';

import clsx from 'clsx';

import { IconBase } from 'app/atoms';
import { ReactComponent as StackIcon } from 'app/icons/base/stack.svg';
import { useCollectiblesListOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { CollectiblesListItemElement } from 'lib/ui/collectibles-list';
import { useAccountAddressForEvm, useAccountAddressForTezos } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { EvmCollectibleItem, TezosCollectibleItem } from '../collectible-item';

import { ShowMore } from './show-more';

interface CollectiblesGroupGridProps {
  isCollapsed: boolean;
  chainSlugs: string[];
  colsCount: 3 | 4;
  isVisible: boolean;
  areDetailsShown?: boolean;
  firstItemRef?: Ref<CollectiblesListItemElement>;
  itemTestID?: string;
  itemNameTestID?: string;
  showMoreTestID?: string;
  onShowMore: EmptyFn;
}

export const CollectiblesGroupGrid: FC<CollectiblesGroupGridProps> = ({
  isCollapsed,
  chainSlugs,
  colsCount,
  isVisible,
  areDetailsShown = false,
  firstItemRef,
  itemTestID,
  itemNameTestID,
  showMoreTestID,
  onShowMore
}) => {
  const displayedNftsSlugs = isCollapsed ? chainSlugs.slice(0, colsCount) : chainSlugs;

  return (
    <div className={clsx('grid gap-2', { 'grid-cols-3': colsCount === 3, 'grid-cols-4': colsCount === 4 })}>
      {displayedNftsSlugs.map((chainSlug, i) =>
        i === displayedNftsSlugs.length - 1 && displayedNftsSlugs.length !== chainSlugs.length ? (
          <ShowMore
            key={chainSlug}
            chainSlug={chainSlug}
            addDetailsPlaceholder={areDetailsShown}
            gridIsVisible={isVisible}
            overlayClassName={colsCount === 3 ? 'backdrop-blur-[25px]' : 'backdrop-blur-[10px] bg-black/40'}
            overlayStyle={{
              background:
                colsCount === 3
                  ? `conic-gradient(from 90deg,rgba(107, 106, 142, 0.5) 0deg,rgba(255, 91, 0, 0.5) 99deg,\
rgba(19, 115, 228, 0.5) 300.6deg,rgba(107, 106, 142, 0.5) 360deg)`
                  : undefined
            }}
            testID={showMoreTestID}
            onClick={onShowMore}
          >
            {colsCount === 3 ? (
              <>
                <IconBase Icon={StackIcon} className="text-white" />
                <span className="text-font-num-12 text-white">{chainSlugs.length - colsCount + 1}</span>
              </>
            ) : (
              <span className="text-font-num-14 text-white">+{chainSlugs.length - colsCount + 1}</span>
            )}
          </ShowMore>
        ) : (
          <NftView
            key={chainSlug}
            chainSlug={chainSlug}
            gridIsVisible={isVisible}
            areDetailsShown={areDetailsShown}
            ref={i === 0 ? firstItemRef : undefined}
            testID={itemTestID}
            nameTestID={itemNameTestID}
          />
        )
      )}
    </div>
  );
};

interface NftViewProps {
  chainSlug: string;
  gridIsVisible: boolean;
  areDetailsShown: boolean;
  ref?: Ref<CollectiblesListItemElement>;
  testID?: string;
  nameTestID?: string;
}

const NftView: FC<NftViewProps> = ({ chainSlug, gridIsVisible, areDetailsShown, ref, testID, nameTestID }) => {
  const mainnetTokensScamSlugsRecord = useMainnetTokensScamlistSelector();
  const accountTezAddress = useAccountAddressForTezos();
  const accountEvmAddress = useAccountAddressForEvm();
  const { blur } = useCollectiblesListOptionsSelector();
  const [chainKind, chainId, slug] = parseChainAssetSlug(chainSlug);

  const commonProps = {
    assetSlug: slug,
    showDetails: areDetailsShown,
    manageActive: false,
    isVisible: gridIsVisible,
    ref,
    testID,
    nameTestID
  };

  return chainKind === TempleChainKind.Tezos ? (
    <TezosCollectibleItem
      {...commonProps}
      accountPkh={accountTezAddress!}
      tezosChainId={chainId as string}
      adultBlur={blur}
      scam={mainnetTokensScamSlugsRecord[slug]}
    />
  ) : (
    <EvmCollectibleItem {...commonProps} evmChainId={chainId as number} accountPkh={accountEvmAddress!} />
  );
};

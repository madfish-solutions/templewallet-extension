import { FC, Ref, useEffect, useState } from 'react';

import clsx from 'clsx';

import { Anchor, IconBase } from 'app/atoms';
import { EvmNetworkLogo, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { SearchHighlightText } from 'app/atoms/SearchHighlightText';
import { useIsItemVisible } from 'app/atoms/visibility-tracking-infinite-scroll';
import { useCollectiblesSearchState } from 'app/hooks/use-assets-view-state';
import { ReactComponent as ChevronDownIcon } from 'app/icons/base/chevron_down.svg';
import { ReactComponent as OutLinkIcon } from 'app/icons/base/outLink.svg';
import { ReactComponent as UnknownCollectible } from 'app/icons/unknown-collectible.svg';
import { CollectiblesGroupGrid } from 'app/templates/collectibles/collectibles-group-grid';
import { setTestID } from 'lib/analytics';
import { fromAssetSlug, parseChainAssetSlug } from 'lib/assets/utils';
import { t } from 'lib/i18n';
import { TempleTezosChainId } from 'lib/temple/types';
import { CollectiblesListItemElement } from 'lib/ui/collectibles-list';

import { NftsPageSelectors } from '../../selectors';
import { CollectiblesCollection } from '../../types';

interface CollectionsListItemProps {
  collection: CollectiblesCollection;
  chainSlugs: string[];
  index: number;
  opened: boolean;
  onToggleOpened: (collectionSlug: string) => void;
  firstItemRef?: Ref<CollectiblesListItemElement>;
}

const collectionImgStyle = { width: '2.5rem', height: '2.5rem' };
const NETWORK_IMAGE_DEFAULT_SIZE = 16;
const commonNetworkLogoProps = {
  size: NETWORK_IMAGE_DEFAULT_SIZE,
  className: 'absolute bottom-0 right-0 z-10',
  withTooltip: true,
  tooltipPlacement: 'bottom' as const
};
const networkLogoSkeletonStyle = { width: NETWORK_IMAGE_DEFAULT_SIZE, height: NETWORK_IMAGE_DEFAULT_SIZE };

export const CollectionsListItem: FC<CollectionsListItemProps> = ({
  collection,
  chainSlugs,
  index,
  opened,
  firstItemRef,
  onToggleOpened
}) => {
  const { collectionSlug, title = t('unknownCollection'), logoSrc, chainId } = collection;
  const [srcIndex, setSrcIndex] = useState(logoSrc ? 0 : -1);
  const handleToggleOpened = () => onToggleOpened(collectionSlug);
  const isVisible = useIsItemVisible(index);
  const { searchValue } = useCollectiblesSearchState();

  useEffect(() => setSrcIndex(logoSrc?.length ? 0 : -1), [logoSrc, setSrcIndex]);

  const handleLogoLoadingError = () => setSrcIndex(prev => (logoSrc && prev < logoSrc.length - 1 ? prev + 1 : -1));

  return (
    <div className="flex flex-col bg-white border-0.5 border-lines mb-4 last:mb-0 p-3 pt-2 rounded-8 gap-2">
      <div className="flex items-center gap-2">
        <div className="p-0.5 relative" style={collectionImgStyle}>
          {isVisible ? (
            <>
              <div className="size-10 rounded-8 overflow-hidden">
                {!logoSrc || srcIndex === -1 ? (
                  <UnknownCollectible className="size-full" />
                ) : (
                  <img
                    src={logoSrc[srcIndex]}
                    alt="Collection logo"
                    className="size-full"
                    onError={handleLogoLoadingError}
                  />
                )}
              </div>

              {typeof chainId === 'number' ? (
                <EvmNetworkLogo chainId={chainId} {...commonNetworkLogoProps} />
              ) : (
                <TezosNetworkLogo chainId={chainId} {...commonNetworkLogoProps} />
              )}
            </>
          ) : (
            <>
              <div className="w-full h-full z-1 bg-grey-3 rounded-8" />
              <div className="absolute bottom-0 right-0 z-10 rounded-full bg-grey-2" style={networkLogoSkeletonStyle} />
            </>
          )}
        </div>

        <div className="flex-1 flex flex-col gap-0.5 overflow-x-hidden">
          {!isVisible && <div className="w-20 h-5 bg-grey-3 rounded" />}
          {isVisible && chainId === TempleTezosChainId.Mainnet && (
            <Anchor
              className="flex items-center group hover:text-secondary text-font-medium-bold"
              href={`https://objkt.com/collections/${fromAssetSlug(parseChainAssetSlug(collectionSlug)[2])[0]}`}
            >
              <span className="truncate">
                <SearchHighlightText searchValue={searchValue}>{title}</SearchHighlightText>
              </span>
              <IconBase className="invisible group-hover:visible m-0.5" Icon={OutLinkIcon} size={12} />
            </Anchor>
          )}
          {isVisible && chainId !== TempleTezosChainId.Mainnet && (
            <p className="text-font-medium-bold truncate">
              <SearchHighlightText searchValue={searchValue}>{title}</SearchHighlightText>
            </p>
          )}
          <p className="text-font-num-10 text-grey-1 truncate">Items: {chainSlugs.length}</p>
        </div>

        {chainSlugs.length > 4 && (
          <button
            className={clsx('p-2 text-grey-1 transform transition-transform duration-500', opened && 'rotate-180')}
            onClick={handleToggleOpened}
            {...setTestID(NftsPageSelectors.showMoreButton)}
          >
            <IconBase Icon={ChevronDownIcon} />
          </button>
        )}
      </div>
      <CollectiblesGroupGrid
        isCollapsed={!opened}
        chainSlugs={chainSlugs}
        colsCount={4}
        isVisible={isVisible}
        areDetailsShown
        firstItemRef={firstItemRef}
        showMoreTestID={NftsPageSelectors.showMoreElement}
        onShowMore={handleToggleOpened}
      />
    </div>
  );
};

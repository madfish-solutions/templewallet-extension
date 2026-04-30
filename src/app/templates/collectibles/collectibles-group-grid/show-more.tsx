import { FC, memo } from 'react';

import clsx from 'clsx';

import { Button } from 'app/atoms';
import { useEvmCollectibleMetadataSelector } from 'app/store/evm/collectibles-metadata/selectors';
import { useEvmCollectiblesMetadataLoadingSelector } from 'app/store/evm/selectors';
import {
  useCollectibleMetadataSelector,
  useCollectiblesMetadataLoadingSelector
} from 'app/store/tezos/collectibles-metadata/selectors';
import { useCollectibleDetailsSelector } from 'app/store/tezos/collectibles/selectors';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { buildObjktCollectibleArtifactUri } from 'lib/images-uri';
import { CollectibleMetadata } from 'lib/metadata/types';
import { ChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { EvmCollectibleItemImage, TezosCollectibleItemImage } from '../collectible-item-image';

interface ShowMoreProps {
  chainSlug: string;
  addDetailsPlaceholder: boolean;
  gridIsVisible: boolean;
  onClick: EmptyFn;
  children: ReactChildren;
  overlayClassName?: string;
  overlayStyle?: React.CSSProperties;
  testID?: string;
}

export const ShowMore = memo<ShowMoreProps>(
  ({ chainSlug, addDetailsPlaceholder, gridIsVisible, onClick, children, overlayClassName, overlayStyle, testID }) => {
    const [chainKind] = parseChainAssetSlug(chainSlug);

    const Content = chainKind === TempleChainKind.Tezos ? TezosShowMoreContent : EvmShowMoreContent;

    return (
      <Content
        chainSlug={chainSlug}
        addDetailsPlaceholder={addDetailsPlaceholder}
        isVisible={gridIsVisible}
        overlayClassName={overlayClassName}
        overlayStyle={overlayStyle}
        onClick={onClick}
        testID={testID}
      >
        {children}
      </Content>
    );
  }
);

interface DefaultShowMoreLayoutProps<T extends TempleChainKind> {
  assetSlug: string;
  chainId: ChainId<T>;
  metadata?: CollectibleMetadata<T>;
  addDetailsPlaceholder: boolean;
  metadatasLoading: boolean;
  isVisible: boolean;
  overlayClassName?: string;
  overlayStyle?: React.CSSProperties;
  onClick: EmptyFn;
  children: ReactChildren;
  testID?: string;
}

const ShowMoreLayoutHOC = <
  T extends TempleChainKind,
  P extends DefaultShowMoreLayoutProps<T> = DefaultShowMoreLayoutProps<T>
>(
  CollectibleItemImage: FC<Pick<P, 'metadata' | 'assetSlug'> & Omit<P, keyof DefaultShowMoreLayoutProps<T>>>,
  className?: string
) =>
  memo<P>(props => {
    const {
      assetSlug,
      metadata,
      chainId,
      addDetailsPlaceholder,
      metadatasLoading,
      isVisible,
      onClick,
      children,
      overlayClassName,
      overlayStyle,
      testID,
      ...restProps
    } = props;

    return (
      <Button
        onClick={onClick}
        className={clsx('relative flex flex-col overflow-hidden group rounded-8', className)}
        testID={testID}
      >
        <div
          className={clsx(
            'relative flex items-center justify-center bg-grey-4 rounded-8 overflow-hidden w-full aspect-square',
            isVisible && 'border-2 border-transparent',
            'group-hover:border-secondary'
          )}
        >
          {!isVisible && <div className="w-full h-full z-1 bg-grey-3" />}
          {(!metadatasLoading || metadata) && isVisible && (
            <CollectibleItemImage metadata={metadata} assetSlug={assetSlug} {...restProps} />
          )}
        </div>

        {addDetailsPlaceholder && <div className="pt-1 w-full h-5" />}

        <div
          className={clsx(
            'absolute top-0 left-0 right-0 aspect-square flex items-center justify-center rounded-8 z-1',
            overlayClassName
          )}
          style={overlayStyle}
        >
          {children}
        </div>
      </Button>
    );
  });

const TezosShowMoreLayout = ShowMoreLayoutHOC<
  TempleChainKind.Tezos,
  DefaultShowMoreLayoutProps<TempleChainKind.Tezos> & { mime: string | nullish; extraSrc?: string }
>(
  props => <TezosCollectibleItemImage {...props} adultBlur={false} areDetailsLoading={false} containerElemRef={null} />,
  'items-center justify-center'
);

const EvmShowMoreLayout = ShowMoreLayoutHOC<TempleChainKind.EVM, DefaultShowMoreLayoutProps<TempleChainKind.EVM>>(
  EvmCollectibleItemImage
);

interface ShowMoreContentProps {
  chainSlug: string;
  addDetailsPlaceholder: boolean;
  isVisible: boolean;
  overlayClassName?: string;
  overlayStyle?: React.CSSProperties;
  onClick: EmptyFn;
  children: ReactChildren;
  testID?: string;
}

const TezosShowMoreContent = memo<ShowMoreContentProps>(({ chainSlug, ...restProps }) => {
  const [, chainId, assetSlug] = parseChainAssetSlug<TempleChainKind.Tezos>(chainSlug);
  const metadatasLoading = useCollectiblesMetadataLoadingSelector();
  const metadata = useCollectibleMetadataSelector(assetSlug);
  const details = useCollectibleDetailsSelector(assetSlug);

  return (
    <TezosShowMoreLayout
      {...restProps}
      assetSlug={assetSlug}
      chainId={chainId}
      metadatasLoading={metadatasLoading}
      metadata={metadata}
      mime={details?.mime}
      extraSrc={details?.objktArtifactUri && buildObjktCollectibleArtifactUri(details?.objktArtifactUri)}
    />
  );
});

const EvmShowMoreContent = memo<ShowMoreContentProps>(({ chainSlug, ...restProps }) => {
  const [, chainId, assetSlug] = parseChainAssetSlug<TempleChainKind.EVM>(chainSlug);
  const metadata = useEvmCollectibleMetadataSelector(chainId, assetSlug);
  const metadatasLoading = useEvmCollectiblesMetadataLoadingSelector();

  return (
    <EvmShowMoreLayout
      {...restProps}
      assetSlug={assetSlug}
      chainId={chainId}
      metadata={metadata}
      metadatasLoading={metadatasLoading}
    />
  );
});

import React, { FC, RefObject, forwardRef, memo, useCallback, useMemo, useRef } from 'react';

import clsx from 'clsx';

import { IconBase, ToggleSwitch } from 'app/atoms';
import { EvmNetworkLogo, NetworkLogoPropsBase, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { useIsItemVisible } from 'app/atoms/visibility-tracking-infinite-scroll';
import { ReactComponent as DeleteIcon } from 'app/icons/base/delete.svg';
import { ScamTag } from 'app/pages/Home/OtherComponents/Tokens/components/TokenTag/ScamTag';
import { dispatch } from 'app/store';
import { setEvmCollectibleStatusAction } from 'app/store/evm/assets/actions';
import { useStoredEvmCollectibleSelector } from 'app/store/evm/assets/selectors';
import { useEvmCollectibleMetadataSelector } from 'app/store/evm/collectibles-metadata/selectors';
import { useEvmCollectiblesMetadataLoadingSelector } from 'app/store/evm/selectors';
import { setTezosCollectibleStatusAction } from 'app/store/tezos/assets/actions';
import { useStoredTezosCollectibleSelector } from 'app/store/tezos/assets/selectors';
import { useBalanceSelector } from 'app/store/tezos/balances/selectors';
import {
  useAllCollectiblesDetailsLoadingSelector,
  useCollectibleDetailsSelector
} from 'app/store/tezos/collectibles/selectors';
import {
  useCollectibleMetadataSelector,
  useCollectiblesMetadataLoadingSelector
} from 'app/store/tezos/collectibles-metadata/selectors';
import { DeleteAssetModal } from 'app/templates/remove-asset-modal/delete-asset-modal';
import { setAnotherSelector, setTestID } from 'lib/analytics';
import { getAssetStatus } from 'lib/assets/hooks/utils';
import { useEvmAssetBalance } from 'lib/balances/hooks';
import { getTokenName } from 'lib/metadata';
import { CollectibleMetadata } from 'lib/metadata/types';
import { getCollectibleName, getCollectionName } from 'lib/metadata/utils';
import { CollectiblesListItemElement } from 'lib/ui/collectibles-list';
import { useBooleanState } from 'lib/ui/hooks';
import { ZERO } from 'lib/utils/numbers';
import { Link } from 'lib/woozie';
import { ChainId, ChainOfKind, PublicKeyHash, useEvmChainByChainId, useTezosChainByChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { CollectibleImageLoader } from '../../components/CollectibleImageLoader';
import { CollectibleTabSelectors } from '../selectors';
import { toCollectibleLink } from '../utils';

import { TezosCollectibleItemImage, EvmCollectibleItemImage } from './CollectibleItemImage';

// Fixed sizes to improve large grid performance
const manageImgStyle = { width: '2.625rem', height: '2.625rem' };
const NETWORK_IMAGE_DEFAULT_SIZE = 16;

interface TezosCollectibleItemProps {
  assetSlug: string;
  accountPkh: string;
  tezosChainId: string;
  adultBlur: boolean;
  areDetailsShown: boolean;
  manageActive?: boolean;
  scam?: boolean;
  index?: number;
}

export const TezosCollectibleItem = memo(
  forwardRef<CollectiblesListItemElement, TezosCollectibleItemProps>(
    ({ assetSlug, accountPkh, tezosChainId, adultBlur, areDetailsShown, scam, manageActive = false, index }, ref) => {
      const metadata = useCollectibleMetadataSelector(assetSlug);
      const wrapperElemRef = useRef<HTMLDivElement>(null);
      const balanceAtomic = useBalanceSelector(accountPkh, tezosChainId, assetSlug);

      const storedToken = useStoredTezosCollectibleSelector(accountPkh, tezosChainId, assetSlug);

      const metadatasLoading = useCollectiblesMetadataLoadingSelector();

      const checked = getAssetStatus(balanceAtomic, storedToken?.status) === 'enabled';

      const areDetailsLoading = useAllCollectiblesDetailsLoadingSelector();
      const details = useCollectibleDetailsSelector(assetSlug);

      const collectionName = useMemo(
        () => details?.galleries[0]?.title ?? details?.fa.name ?? 'Unknown Collection',
        [details]
      );

      const assetName = getTokenName(metadata);

      if (manageActive)
        return (
          <ManageTezosListItemLayout
            wrapperElemRef={wrapperElemRef}
            chainId={tezosChainId}
            assetSlug={assetSlug}
            assetName={assetName}
            collectionName={collectionName}
            checked={checked}
            publicKeyHash={accountPkh}
            metadata={metadata}
            adultBlur={adultBlur}
            areDetailsLoading={areDetailsLoading && details === undefined}
            mime={details?.mime}
            scam={scam}
            index={index}
            ref={ref}
          />
        );

      return (
        <DefaultTezosListItemLayout
          wrapperElemRef={wrapperElemRef}
          assetSlug={assetSlug}
          assetName={assetName}
          chainId={tezosChainId}
          metadata={metadata}
          areDetailsShown={areDetailsShown}
          metadatasLoading={metadatasLoading}
          adultBlur={adultBlur}
          areDetailsLoading={areDetailsLoading && details === undefined}
          mime={details?.mime}
          scam={scam}
          index={index}
          ref={ref}
        />
      );
    }
  )
);

interface EvmCollectibleItemProps {
  assetSlug: string;
  evmChainId: number;
  accountPkh: HexString;
  showDetails?: boolean;
  manageActive?: boolean;
  index?: number;
}

export const EvmCollectibleItem = memo(
  forwardRef<CollectiblesListItemElement, EvmCollectibleItemProps>(
    ({ assetSlug, evmChainId, accountPkh, showDetails = false, manageActive = false, index }, ref) => {
      const metadata = useEvmCollectibleMetadataSelector(evmChainId, assetSlug);
      const chain = useEvmChainByChainId(evmChainId);
      const { value: balance = ZERO } = useEvmAssetBalance(assetSlug, accountPkh, chain!);
      const balanceBeforeTruncate = balance.toString();

      const metadatasLoading = useEvmCollectiblesMetadataLoadingSelector();

      const storedToken = useStoredEvmCollectibleSelector(accountPkh, evmChainId, assetSlug);

      const checked = getAssetStatus(balanceBeforeTruncate, storedToken?.status) === 'enabled';

      const assetName = getCollectibleName(metadata);
      const collectionName = getCollectionName(metadata);

      if (manageActive)
        return (
          <ManageEvmListItemLayout
            chainId={evmChainId}
            assetSlug={assetSlug}
            assetName={assetName}
            collectionName={collectionName}
            checked={checked}
            publicKeyHash={accountPkh}
            metadata={metadata}
            index={index}
            ref={ref}
          />
        );

      return (
        <DefaultEvmListItemLayout
          assetSlug={assetSlug}
          assetName={assetName}
          chainId={evmChainId}
          metadata={metadata}
          areDetailsShown={showDetails}
          metadatasLoading={metadatasLoading}
          index={index}
          ref={ref}
        />
      );
    }
  )
);

const MANAGE_ACTIVE_ITEM_CLASSNAME = clsx(
  'flex items-center justify-between w-full overflow-hidden p-2 rounded-8',
  'transition ease-in-out duration-200 focus:outline-none'
);

interface ManageCollectibleListItemLayoutProps<T extends TempleChainKind> {
  wrapperElemRef?: RefObject<HTMLDivElement>;
  chainId: ChainId<T>;
  assetSlug: string;
  assetName: string;
  collectionName: string;
  checked: boolean;
  index?: number;
  scam?: boolean;
  publicKeyHash: PublicKeyHash<T>;
  metadata?: CollectibleMetadata<T>;
}

const ManageCollectibleListItemLayoutHOC = <
  T extends TempleChainKind,
  P extends ManageCollectibleListItemLayoutProps<T> = ManageCollectibleListItemLayoutProps<T>
>(
  NetworkLogo: FC<NetworkLogoPropsBase<T>>,
  CollectibleItemImage: FC<
    Pick<P, 'metadata' | 'assetSlug' | 'wrapperElemRef'> & Omit<P, keyof ManageCollectibleListItemLayoutProps<T>>
  >,
  toggleTokenStatus: (
    newStatus: 'enabled' | 'disabled',
    assetSlug: string,
    chainId: ChainId<T>,
    publicKeyHash: PublicKeyHash<T>
  ) => void,
  deleteItem: (assetSlug: string, chainId: ChainId<T>, publicKeyHash: PublicKeyHash<T>) => void,
  useNetwork: (chainId: ChainId<T>) => ChainOfKind<T> | nullish
) => {
  return memo(
    forwardRef<CollectiblesListItemElement, P>(
      (
        {
          wrapperElemRef,
          chainId,
          assetSlug,
          assetName,
          collectionName,
          checked,
          index,
          publicKeyHash,
          scam,
          metadata,
          ...restProps
        },
        ref
      ) => {
        const network = useNetwork(chainId);
        const [deleteModalOpened, setDeleteModalOpened, setDeleteModalClosed] = useBooleanState(false);
        const isVisible = useIsItemVisible(index);

        const handleCollectibleStatusSwitch = useCallback(() => {
          toggleTokenStatus(checked ? 'disabled' : 'enabled', assetSlug, chainId, publicKeyHash);
        }, [checked, assetSlug, chainId, publicKeyHash]);

        const handleDeleteClick = useCallback(() => {
          deleteItem(assetSlug, chainId, publicKeyHash);
        }, [assetSlug, chainId, publicKeyHash]);

        return (
          <>
            <div
              className={clsx(
                MANAGE_ACTIVE_ITEM_CLASSNAME,
                'focus:bg-secondary-low',
                scam ? 'hover:bg-error-low' : 'hover:bg-secondary-low'
              )}
              ref={ref as RefObject<HTMLDivElement>}
            >
              <div className="flex items-center gap-x-1.5">
                <div
                  ref={wrapperElemRef}
                  style={manageImgStyle}
                  className="relative flex items-center justify-center rounded-8 overflow-hidden bg-grey-4"
                >
                  {isVisible ? (
                    <CollectibleItemImage metadata={metadata} assetSlug={assetSlug} {...restProps} />
                  ) : (
                    <div className="w-full h-full z-1 bg-grey-3" />
                  )}

                  {network && isVisible && (
                    <NetworkLogo
                      chainId={network.chainId}
                      size={NETWORK_IMAGE_DEFAULT_SIZE}
                      className="absolute bottom-0.5 right-0.5 z-30"
                      withTooltip
                      tooltipPlacement="bottom"
                    />
                  )}
                  {network && !isVisible && (
                    <div
                      className="absolute bottom-0.5 right-0.5 z-30 rounded-full bg-grey-2"
                      style={{ width: NETWORK_IMAGE_DEFAULT_SIZE, height: NETWORK_IMAGE_DEFAULT_SIZE }}
                    />
                  )}
                </div>

                <div className="flex flex-col max-w-44">
                  {isVisible ? (
                    <>
                      <div className="flex items-start gap-0.5">
                        <div className="text-font-medium mb-1 truncate">{assetName}</div>
                        {scam && <ScamTag />}
                      </div>
                      <div className="flex text-font-description items-center text-grey-1 truncate">
                        {collectionName}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-5 mb-1 bg-grey-3 rounded" />
                      <div className="w-20 h-4 bg-grey-3 rounded" />
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-x-2">
                {isVisible ? (
                  <>
                    <IconBase Icon={DeleteIcon} className="cursor-pointer text-error" onClick={setDeleteModalOpened} />
                    <ToggleSwitch checked={checked} onChange={handleCollectibleStatusSwitch} />
                  </>
                ) : (
                  <>
                    <div className="size-6 bg-grey-3 rounded" />
                    <div className="w-12 h-6 bg-grey-3 rounded" />
                  </>
                )}
              </div>
            </div>

            {deleteModalOpened && <DeleteAssetModal onClose={setDeleteModalClosed} onDelete={handleDeleteClick} />}
          </>
        );
      }
    )
  );
};
const ManageTezosListItemLayout = ManageCollectibleListItemLayoutHOC<
  TempleChainKind.Tezos,
  ManageCollectibleListItemLayoutProps<TempleChainKind.Tezos> & {
    adultBlur: boolean;
    areDetailsLoading: boolean;
    mime: string | nullish;
    wrapperElemRef: RefObject<HTMLDivElement>;
  }
>(
  TezosNetworkLogo,
  ({ wrapperElemRef, ...restProps }) => (
    <TezosCollectibleItemImage manageActive containerElemRef={wrapperElemRef} {...restProps} />
  ),
  (status, assetSlug, chainId, account) =>
    void dispatch(setTezosCollectibleStatusAction({ account, chainId, slug: assetSlug, status })),
  (assetSlug, chainId, account) =>
    void dispatch(setTezosCollectibleStatusAction({ account, chainId, slug: assetSlug, status: 'removed' })),
  useTezosChainByChainId
);
const ManageEvmListItemLayout = ManageCollectibleListItemLayoutHOC<TempleChainKind.EVM>(
  EvmNetworkLogo,
  ({ metadata }) => <EvmCollectibleItemImage metadata={metadata} className="object-cover" />,
  (status, assetSlug, chainId, account) =>
    void dispatch(setEvmCollectibleStatusAction({ account, chainId, slug: assetSlug, status })),
  (assetSlug, chainId, account) =>
    void dispatch(setEvmCollectibleStatusAction({ account, chainId, slug: assetSlug, status: 'removed' })),
  useEvmChainByChainId
);

interface DefaultCollectibleListItemLayoutProps<T extends TempleChainKind> {
  wrapperElemRef?: RefObject<HTMLDivElement>;
  assetSlug: string;
  assetName: string;
  chainId: ChainId<T>;
  metadata?: CollectibleMetadata<T>;
  areDetailsShown: boolean;
  metadatasLoading: boolean;
  scam?: boolean;
  index?: number;
}

const DefaultCollectibleListItemLayoutHOC = <
  T extends TempleChainKind,
  P extends DefaultCollectibleListItemLayoutProps<T> = DefaultCollectibleListItemLayoutProps<T>
>(
  chainKind: T,
  NetworkLogo: FC<NetworkLogoPropsBase<T>>,
  CollectibleItemImage: FC<
    Pick<P, 'metadata' | 'assetSlug' | 'wrapperElemRef'> & Omit<P, keyof DefaultCollectibleListItemLayoutProps<T>>
  >,
  useNetwork: (chainId: ChainId<T>) => ChainOfKind<T> | nullish,
  className?: string
) =>
  forwardRef<CollectiblesListItemElement, P>(
    (
      {
        wrapperElemRef,
        assetSlug,
        assetName,
        metadata,
        chainId,
        areDetailsShown,
        metadatasLoading,
        scam,
        index,
        ...restProps
      },
      ref
    ) => {
      const network = useNetwork(chainId);
      const isVisible = useIsItemVisible(index);

      return (
        <Link
          to={toCollectibleLink(chainKind, chainId, assetSlug)}
          className={clsx('flex flex-col overflow-hidden group', isVisible ? 'rounded-8' : 'rounded-t-8', className)}
          testID={CollectibleTabSelectors.collectibleItem}
          testIDProperties={{ assetSlug: assetSlug }}
          ref={ref as RefObject<HTMLAnchorElement>}
        >
          <div
            ref={wrapperElemRef}
            className={clsx(
              'relative flex items-center justify-center bg-grey-4 rounded-8 overflow-hidden w-full aspect-square',
              isVisible && 'border-2 border-transparent',
              scam && isVisible ? 'hover:bg-error' : 'group-hover:border-secondary'
            )}
          >
            {scam && (
              <div className="absolute z-50 top-1.5 left-1.5 ">
                <ScamTag />
              </div>
            )}
            {!isVisible && (
              <>
                <div className="w-full h-full z-1 bg-grey-3" />
                <div
                  className="absolute bottom-1 right-1 z-10 rounded-full bg-grey-2"
                  style={{ width: NETWORK_IMAGE_DEFAULT_SIZE, height: NETWORK_IMAGE_DEFAULT_SIZE }}
                />
              </>
            )}
            {metadatasLoading && !metadata && isVisible && <CollectibleImageLoader />}
            {(!metadatasLoading || metadata) && isVisible && (
              <>
                <CollectibleItemImage metadata={metadata} assetSlug={assetSlug} {...restProps} />

                {network && (
                  <NetworkLogo
                    chainId={network.chainId}
                    size={NETWORK_IMAGE_DEFAULT_SIZE}
                    className="absolute bottom-1 right-1 z-10"
                    withTooltip
                    tooltipPlacement="bottom"
                  />
                )}
              </>
            )}
          </div>

          {areDetailsShown && isVisible && (
            <div
              className="pt-1 w-full text-font-description truncate h-5"
              {...setTestID(CollectibleTabSelectors.collectibleName)}
              {...setAnotherSelector('name', assetName)}
            >
              {assetName}
            </div>
          )}
          {areDetailsShown && !isVisible && (
            <div className="pt-1 w-full h-5">
              <div className="w-full h-4 bg-grey-3 rounded" />
            </div>
          )}
        </Link>
      );
    }
  );
const DefaultTezosListItemLayout = DefaultCollectibleListItemLayoutHOC<
  TempleChainKind.Tezos,
  DefaultCollectibleListItemLayoutProps<TempleChainKind.Tezos> & {
    adultBlur: boolean;
    areDetailsLoading: boolean;
    mime: string | nullish;
    wrapperElemRef: RefObject<HTMLDivElement>;
  }
>(
  TempleChainKind.Tezos,
  TezosNetworkLogo,
  ({ wrapperElemRef, ...restProps }) => (
    <TezosCollectibleItemImage
      shouldUseBlurredBg
      containerElemRef={wrapperElemRef}
      className="object-contain"
      {...restProps}
    />
  ),
  useTezosChainByChainId,
  'items-center justify-center'
);
const DefaultEvmListItemLayout = DefaultCollectibleListItemLayoutHOC<TempleChainKind.EVM>(
  TempleChainKind.EVM,
  EvmNetworkLogo,
  ({ metadata }) => <EvmCollectibleItemImage shouldUseBlurredBg metadata={metadata} className="object-contain" />,
  useEvmChainByChainId
);

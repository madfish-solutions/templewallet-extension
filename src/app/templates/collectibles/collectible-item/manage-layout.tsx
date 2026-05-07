import { FC, memo, Ref } from 'react';

import clsx from 'clsx';

import { IconBase, ToggleSwitch } from 'app/atoms';
import { EvmNetworkLogo, NetworkLogoPropsBase, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { useIsItemVisible } from 'app/atoms/visibility-tracking-infinite-scroll';
import { ReactComponent as DeleteIcon } from 'app/icons/base/delete.svg';
import { dispatch } from 'app/store';
import { setEvmCollectibleStatusAction } from 'app/store/evm/assets/actions';
import { setTezosCollectibleStatusAction } from 'app/store/tezos/assets/actions';
import { DeleteAssetModal } from 'app/templates/remove-asset-modal/delete-asset-modal';
import { ScamTag } from 'app/templates/scam-tag';
import { setTestID } from 'lib/analytics';
import { useBooleanState } from 'lib/ui/hooks';
import { ChainId, ChainOfKind, PublicKeyHash, useEvmChainByChainId, useTezosChainByChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { EvmCollectibleItemImage, TezosCollectibleItemImage } from '../collectible-item-image';

import { CommonLayoutProps } from './types';

// Fixed sizes to improve large grid performance
const manageImgStyle = { width: '2.625rem', height: '2.625rem' };
const NETWORK_IMAGE_DEFAULT_SIZE = 16;

interface ManageCollectibleListItemLayoutProps<T extends TempleChainKind> extends CommonLayoutProps<T> {
  collectionName: string;
  checked: boolean;
  publicKeyHash: PublicKeyHash<T>;
}

const MANAGE_ACTIVE_ITEM_CLASSNAME = clsx(
  'flex items-center justify-between w-full overflow-hidden p-2 rounded-8',
  'transition ease-in-out duration-200 focus:outline-hidden'
);

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
) =>
  memo<P>(props => {
    const {
      wrapperElemRef,
      chainId,
      assetSlug,
      assetName,
      collectionName,
      checked,
      index,
      isVisible: isVisibleFromProps,
      publicKeyHash,
      scam,
      metadata,
      ref,
      testID,
      nameTestID,
      ...restProps
    } = props;

    const network = useNetwork(chainId);
    const [deleteModalOpened, setDeleteModalOpened, setDeleteModalClosed] = useBooleanState(false);
    const defaultIsVisible = useIsItemVisible(index);
    const isVisible = isVisibleFromProps ?? defaultIsVisible;

    const handleCollectibleStatusSwitch = () =>
      toggleTokenStatus(checked ? 'disabled' : 'enabled', assetSlug, chainId, publicKeyHash);

    const handleDeleteClick = () => deleteItem(assetSlug, chainId, publicKeyHash);

    return (
      <>
        <div
          className={clsx(
            MANAGE_ACTIVE_ITEM_CLASSNAME,
            'focus:bg-secondary-low',
            scam ? 'hover:bg-error-low' : 'hover:bg-secondary-low'
          )}
          ref={ref as Ref<HTMLDivElement>}
          {...setTestID(testID)}
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
                    <div className="text-font-medium mb-1 truncate" {...setTestID(nameTestID)}>
                      {assetName}
                    </div>
                    {scam && <ScamTag />}
                  </div>
                  <div className="flex text-font-description items-center text-grey-1 truncate">{collectionName}</div>
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
  });

export const ManageTezosListItemLayout = ManageCollectibleListItemLayoutHOC<
  TempleChainKind.Tezos,
  ManageCollectibleListItemLayoutProps<TempleChainKind.Tezos> & {
    adultBlur: boolean;
    areDetailsLoading: boolean;
    mime: string | nullish;
    extraSrc?: string;
    wrapperElemRef: Ref<HTMLDivElement>;
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

export const ManageEvmListItemLayout = ManageCollectibleListItemLayoutHOC<TempleChainKind.EVM>(
  EvmNetworkLogo,
  ({ metadata }) => <EvmCollectibleItemImage metadata={metadata} className="object-cover" />,
  (status, assetSlug, chainId, account) =>
    void dispatch(setEvmCollectibleStatusAction({ account, chainId, slug: assetSlug, status })),
  (assetSlug, chainId, account) =>
    void dispatch(setEvmCollectibleStatusAction({ account, chainId, slug: assetSlug, status: 'removed' })),
  useEvmChainByChainId
);

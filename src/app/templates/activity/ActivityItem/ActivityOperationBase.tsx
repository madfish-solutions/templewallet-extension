import React, { FC, memo, ReactElement, ReactNode, useMemo } from 'react';

import clsx from 'clsx';

import { Anchor, Button, HashShortView, IconBase, Money } from 'app/atoms';
import { EvmNetworkLogo, TezosNetworkLogo } from 'app/atoms/NetworkLogo';
import { ReactComponent as ChevronRightSvg } from 'app/icons/base/chevron_right.svg';
import { ReactComponent as DocumentsSvg } from 'app/icons/base/documents.svg';
import { ReactComponent as IncomeSvg } from 'app/icons/base/income.svg';
import { ReactComponent as OkSvg } from 'app/icons/base/ok.svg';
import { ReactComponent as OutLinkIcon } from 'app/icons/base/outLink.svg';
import { ReactComponent as SendSvg } from 'app/icons/base/send.svg';
import { EvmAssetIcon, TezosAssetIcon } from 'app/templates/AssetIcon';
import { InFiat } from 'app/templates/InFiat';
import { ActivityOperKindEnum, ActivityOperTransferType, ActivityStatus } from 'lib/activity';
import { isTransferActivityOperKind } from 'lib/activity/utils';
import { toEvmAssetSlug, toTezosAssetSlug } from 'lib/assets/utils';
import { atomsToTokens } from 'lib/temple/helpers';

import { FaceKind } from '../utils';

import { ReactComponent as PendingSpinSvg } from './pending-spin.svg';

interface Props {
  chainId: string | number;
  kind: FaceKind;
  transferType?: ActivityOperTransferType;
  hash: string;
  asset?: ActivityItemBaseAssetProp;
  blockExplorerUrl?: string;
  status?: ActivityStatus;
  withoutAssetIcon?: boolean;
  onClick?: EmptyFn;
  addressChip?: ReactElement | null;
}

export interface ActivityItemBaseAssetProp {
  contract: string;
  tokenId?: string;
  /** `null` for 'unlimited' amount */
  amountSigned?: string | null;
  decimals: number;
  symbol?: string;
  iconURL?: string;
  nft?: boolean;
}

export const ActivityOperationBaseComponent = memo<Props>(
  ({ kind, transferType, hash, chainId, asset, blockExplorerUrl, status, withoutAssetIcon, onClick, addressChip }) => {
    const assetSlug = asset
      ? typeof chainId === 'number'
        ? toEvmAssetSlug(asset.contract, asset.tokenId)
        : toTezosAssetSlug(asset.contract, asset.tokenId)
      : null;

    const amountJsx = useMemo<ReactNode>(() => {
      if (!asset) return null;

      const symbol = asset.symbol || (kind === ActivityOperKindEnum.approve ? '---' : '');
      const symbolStr = symbol.length > 6 ? `${symbol.slice(0, 6)}...` : symbol;

      return (
        <div
          className={clsx(
            'max-w-40 flex text-font-num-14 overflow-hidden',
            asset.amountSigned && Number(asset.amountSigned) > 0 && 'text-success',
            onClick && 'group-hover:hidden'
          )}
        >
          {kind === ActivityOperKindEnum.approve ? null : asset.amountSigned ? (
            <Money smallFractionFont={false} withSign>
              {atomsToTokens(asset.amountSigned, asset.decimals)}
            </Money>
          ) : null}

          {symbolStr ? <span className="whitespace-pre"> {symbolStr}</span> : null}
        </div>
      );
    }, [asset, kind, onClick]);

    const fiatJsx = useMemo<ReactNode>(() => {
      if (!asset) return null;

      if (!asset.amountSigned) return asset.amountSigned === null ? 'Unlimited' : null;

      if (kind === ActivityOperKindEnum.approve)
        return <Money smallFractionFont={false}>{atomsToTokens(asset.amountSigned, asset.decimals)}</Money>;

      if (!assetSlug) return null;

      const amountForFiat =
        kind === 'bundle' || isTransferActivityOperKind(kind)
          ? atomsToTokens(asset.amountSigned, asset.decimals)
          : null;

      if (!amountForFiat) return null;

      return (
        <InFiat
          evm={typeof chainId === 'number'}
          chainId={chainId}
          assetSlug={assetSlug}
          volume={amountForFiat}
          smallFractionFont={false}
          withSign
        >
          {({ balance, symbol, noPrice }) =>
            noPrice ? (
              <span>No value</span>
            ) : (
              <>
                {balance}
                <span className="ml-1">{symbol}</span>
              </>
            )
          }
        </InFiat>
      );
    }, [asset, kind, assetSlug, chainId]);

    const chipJsx = useMemo(
      () =>
        addressChip ?? (
          <Anchor
            href={blockExplorerUrl}
            target="_blank"
            className="flex items-center gap-x-1 group-hover:text-secondary"
          >
            <span>
              <HashShortView hash={hash} firstCharsCount={6} lastCharsCount={4} />
            </span>

            <IconBase Icon={OutLinkIcon} size={12} className="invisible group-hover:visible" />
          </Anchor>
        ),
      [addressChip, hash, blockExplorerUrl]
    );

    const isNFT = Boolean(asset?.nft);

    const faceIconJsx = useMemo(
      () =>
        withoutAssetIcon || !assetSlug ? (
          <div className="w-full h-full flex items-center justify-center bg-grey-4">
            <IconBase Icon={getIconByKind(kind, transferType)} className="text-grey-1" />
          </div>
        ) : typeof chainId === 'number' ? (
          <EvmAssetIcon
            evmChainId={chainId}
            assetSlug={assetSlug}
            className="w-full h-full object-cover"
            extraSrc={asset?.iconURL}
          />
        ) : (
          <TezosAssetIcon
            tezosChainId={chainId}
            assetSlug={assetSlug}
            className="w-full h-full object-cover"
            extraSrc={asset?.iconURL}
          />
        ),
      [chainId, withoutAssetIcon, kind, transferType, asset?.iconURL, assetSlug]
    );

    return (
      <div
        className={clsx(
          'z-1 relative group flex gap-x-2 p-2 rounded-lg hover:bg-secondary-low',
          onClick && 'cursor-pointer'
        )}
      >
        <div className="relative shrink-0 self-center flex items-center justify-center flex items-start w-10 h-10">
          {kind === 'bundle' ? (
            <BundleIconsStack withoutAssetIcon={withoutAssetIcon} isNFT={isNFT}>
              {faceIconJsx}
            </BundleIconsStack>
          ) : (
            <div className={clsx('w-9 h-9 overflow-hidden', isNFT ? 'rounded-lg' : 'rounded-full')}>{faceIconJsx}</div>
          )}

          {withoutAssetIcon ? null : typeof chainId === 'number' ? (
            <EvmNetworkLogo chainId={chainId} size={16} className="absolute bottom-0 right-0" withTooltip />
          ) : (
            <TezosNetworkLogo chainId={chainId} size={16} className="absolute bottom-0 right-0" withTooltip />
          )}
        </div>

        <div className="flex-grow flex flex-col gap-y-1 whitespace-nowrap overflow-hidden">
          <div className="flex gap-x-2 justify-between">
            <div className="shrink-0 flex items-center gap-x-1">
              <span className="text-font-medium">{getTitleByKind(kind, transferType)}</span>

              <StatusTag status={status} />
            </div>

            {amountJsx}
          </div>

          <div className="flex gap-x-2 justify-between text-font-num-12 text-grey-1">
            {chipJsx}

            <div className={clsx('shrink-0 flex', onClick && 'group-hover:hidden')}>{fiatJsx}</div>
          </div>
        </div>

        {onClick && (
          <Button
            className={clsx(
              'flex items-center flex-nowrap py-0.5 px-1 text-secondary',
              'absolute right-2 top-1/2 -translate-y-1/2',
              'hidden group-hover:flex'
            )}
            onClick={onClick}
          >
            <span className="text-font-description-bold">Details</span>

            <IconBase Icon={ChevronRightSvg} size={12} />
          </Button>
        )}
      </div>
    );
  }
);

const MEDALION_CLASS_NAME = 'absolute border border-lines';

const BundleIconsStack = memo<PropsWithChildren<{ withoutAssetIcon?: boolean; isNFT?: boolean }>>(
  ({ withoutAssetIcon, isNFT, children }) => {
    return (
      <>
        <div
          className={clsx(MEDALION_CLASS_NAME, 'w-6 h-6 top-0 left-0', withoutAssetIcon ? 'bg-grey-4' : 'bg-white')}
          style={{ borderRadius: isNFT ? 6 : '100%' }}
        />

        <div
          className={clsx(MEDALION_CLASS_NAME, 'w-7 h-7 shadow-center', withoutAssetIcon ? 'bg-grey-4' : 'bg-white')}
          style={{ top: 3, left: 3, borderRadius: isNFT ? 7 : '100%' }}
        />

        <div
          className={clsx(
            MEDALION_CLASS_NAME,
            'w-8 h-8 shadow-center',
            'flex items-center justify-center',
            'bottom-0.5 right-0.5',
            withoutAssetIcon ? 'bg-grey-4' : 'bg-white'
          )}
          style={{ borderRadius: isNFT ? 8 : '100%' }}
        >
          <div className="w-7 h-7 overflow-hidden" style={{ borderRadius: isNFT ? 7 : '100%' }}>
            {children}
          </div>
        </div>
      </>
    );
  }
);

const StatusTag: FC<{ status?: ActivityStatus }> = ({ status }) => {
  if (status === ActivityStatus.failed) return StatusTagFailed;

  if (status === ActivityStatus.pending) return StatusTagPending;

  return null;
};

const StatusTagFailed = (
  <div className="text-font-small-bold h-4 px-1 leading-4 text-error border-0.5 border-error bg-error-low rounded">
    FAILED
  </div>
);

const StatusTagPending = <PendingSpinSvg className="w-4 h-4 animate-spin" />;

function getTitleByKind(kind: FaceKind, transferType?: ActivityOperTransferType) {
  if (kind === 'bundle') return 'Bundle';

  if (kind === ActivityOperKindEnum.interaction) return 'Interaction';

  if (kind === ActivityOperKindEnum.approve) return 'Approve';

  return transferType == null ? 'Interaction' : TransferTypeTitle[transferType];
}

const TransferTypeTitle: Record<ActivityOperTransferType, string> = {
  [ActivityOperTransferType.sendToAccount]: 'Send',
  [ActivityOperTransferType.receiveFromAccount]: 'Receive',
  [ActivityOperTransferType.send]: 'Transfer',
  [ActivityOperTransferType.receive]: 'Transfer'
};

function getIconByKind(kind: FaceKind, transferType?: ActivityOperTransferType) {
  if (kind === 'bundle') return DocumentsSvg;

  if (kind === ActivityOperKindEnum.interaction) return DocumentsSvg;

  if (kind === ActivityOperKindEnum.approve) return OkSvg;

  return transferType == null ? DocumentsSvg : TransferTypeIconSvg[transferType];
}

const TransferTypeIconSvg: Record<ActivityOperTransferType, ImportedSVGComponent> = {
  [ActivityOperTransferType.sendToAccount]: SendSvg,
  [ActivityOperTransferType.receiveFromAccount]: IncomeSvg,
  [ActivityOperTransferType.send]: DocumentsSvg,
  [ActivityOperTransferType.receive]: DocumentsSvg
};

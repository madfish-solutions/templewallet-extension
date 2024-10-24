import React, { FC, memo } from 'react';

import clsx from 'clsx';

import { IdenticonInitials } from 'app/atoms/Identicon';
import { ReactComponent as DocumentsSvg } from 'app/icons/base/documents.svg';
import { ReactComponent as IncomeSvg } from 'app/icons/base/income.svg';
import { ReactComponent as OkSvg } from 'app/icons/base/ok.svg';
import { ReactComponent as SendSvg } from 'app/icons/base/send.svg';
import { ActivityOperKindEnum, ActivityOperTransferType, ActivityStatus } from 'lib/activity';

import { FaceKind } from '../../utils';
import { ReactComponent as PendingSpinSvg } from '../pending-spin.svg';

import { ReactComponent as NftPlaceholderSvg } from './nft.svg';
import { ReactComponent as TokenPlaceholderSvg } from './token.svg';

const MEDALLION_CLASS_NAME = 'absolute border border-lines';

export const BundleIconsStack = memo<PropsWithChildren<{ withoutAssetIcon?: boolean; isNFT?: boolean }>>(
  ({ withoutAssetIcon, isNFT, children }) => {
    const bgClassName = withoutAssetIcon ? 'bg-grey-4' : 'bg-white';

    return (
      <>
        <div
          className={clsx(
            MEDALLION_CLASS_NAME,
            'w-6 h-6 top-0 left-0',
            isNFT ? 'rounded-6' : 'rounded-full',
            bgClassName
          )}
        />

        <div
          className={clsx(
            MEDALLION_CLASS_NAME,
            'w-7 h-7 shadow-center',
            isNFT ? 'rounded-7' : 'rounded-full',
            bgClassName
          )}
          style={{ top: 3, left: 3 }}
        />

        <div
          className={clsx(
            MEDALLION_CLASS_NAME,
            'w-8 h-8 shadow-center',
            'flex items-center justify-center',
            'bottom-0.5 right-0.5',
            isNFT ? 'rounded-8' : 'rounded-full',
            bgClassName
          )}
        >
          <div className={clsx('w-7 h-7 overflow-hidden', isNFT ? 'rounded-7' : 'rounded-full')}>{children}</div>
        </div>
      </>
    );
  }
);

export const StatusTag: FC<{ status?: ActivityStatus }> = ({ status }) => {
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

export function getTitleByKind(kind: FaceKind, transferType?: ActivityOperTransferType) {
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

export function getIconByKind(kind: FaceKind, transferType?: ActivityOperTransferType) {
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

export const AssetIconPlaceholder: FC<{ isNFT: boolean; symbol?: string; className?: string }> = ({
  isNFT,
  symbol,
  className
}) => {
  if (isNFT) return <NftPlaceholderSvg className={className} />;

  return symbol ? (
    <IdenticonInitials value={symbol} className={className} />
  ) : (
    <TokenPlaceholderSvg className={className} />
  );
};

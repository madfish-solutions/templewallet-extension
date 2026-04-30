import React, { FC, memo, useState } from 'react';

import clsx from 'clsx';

import { Button, IconBase } from 'app/atoms';
import { HashChip } from 'app/atoms/HashChip';
import { ReactComponent as CompactDown } from 'app/icons/base/chevron_down.svg';
import { ReactComponent as CopyIcon } from 'app/icons/base/copy.svg';
import { ChartListItem } from 'app/templates/chart-list-item';
import { toastSuccess } from 'app/toaster';
import { CROSS_CHAIN_DEFAULT_ETA, CrossChainAsset } from 'lib/cross-chain';
import { T, TID, t } from 'lib/i18n';

import { CrossChainAmountRow } from '../../components/CrossChainAmountRow';

interface Props {
  fromAsset: CrossChainAsset;
  toAsset: CrossChainAsset;
  fromAmount: string;
  toAmountEstimated: string;
  toAmountActual?: string;
  senderAddress?: string;
  recipient: string;
  exolixId: string;
  depositTxHash?: string;
  showEstimatedTime?: boolean;
  defaultExpanded?: boolean;
}

export const ExchangeSummaryCard = memo<Props>(
  ({
    fromAsset,
    toAsset,
    fromAmount,
    toAmountEstimated,
    toAmountActual,
    senderAddress,
    recipient,
    exolixId,
    depositTxHash,
    showEstimatedTime = true,
    defaultExpanded = false
  }) => {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const effectiveToAmount = toAmountActual || toAmountEstimated;

    return (
      <div className="rounded-8 bg-white border-0.5 border-lines overflow-hidden">
        <div className="px-4 pt-4 pb-3 flex flex-col gap-y-3">
          <DirectionalAmountRow
            labelId="send"
            directionLabelId="from"
            address={senderAddress}
            asset={fromAsset}
            amount={fromAmount}
            sign="-"
            valueClassName="text-error"
          />
          <div className="h-px bg-lines" />
          <DirectionalAmountRow
            labelId="get"
            directionLabelId="toAsset"
            address={recipient}
            asset={toAsset}
            amount={effectiveToAmount}
            sign="+"
            valueClassName="text-success"
          />
        </div>

        <div
          className={clsx(
            'grid transition-[grid-template-rows] duration-300 ease-in-out',
            expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          )}
        >
          <div className="overflow-hidden">
            <div className="px-4">
              <ChartListItem title={t('transactionId')} bottomSeparator={showEstimatedTime || Boolean(depositTxHash)}>
                <CopyableText text={exolixId} />
              </ChartListItem>
              {showEstimatedTime && (
                <ChartListItem title={t('estimatedTime')} bottomSeparator={Boolean(depositTxHash)}>
                  <span className="p-1 text-font-num-12">{CROSS_CHAIN_DEFAULT_ETA}</span>
                </ChartListItem>
              )}
              {depositTxHash && (
                <ChartListItem title={t('depositTxHash')} bottomSeparator={false}>
                  <HashChip hash={depositTxHash} firstCharsCount={6} lastCharsCount={4} />
                </ChartListItem>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="w-full flex items-center justify-center pb-2"
          onClick={() => setExpanded(v => !v)}
        >
          <IconBase
            Icon={CompactDown}
            size={16}
            className={clsx(
              'text-grey-1 transform transition-transform duration-300 ease-in-out',
              expanded ? 'rotate-180' : 'rotate-0'
            )}
          />
        </button>
      </div>
    );
  }
);

interface DirectionalAmountRowProps {
  labelId: TID;
  directionLabelId: TID;
  address?: string;
  asset: CrossChainAsset;
  amount: string;
  sign: '-' | '+';
  valueClassName: string;
}

const DirectionalAmountRow: FC<DirectionalAmountRowProps> = ({
  labelId,
  directionLabelId,
  address,
  asset,
  amount,
  sign,
  valueClassName
}) => (
  <div className="flex flex-col gap-y-1">
    <div className="flex items-center justify-between">
      <span className="text-font-description-bold text-grey-1">
        <T id={labelId} />
      </span>
      {address && (
        <div className="flex items-center gap-x-1">
          <span className="text-font-description text-grey-1">
            <T id={directionLabelId} />
          </span>
          <HashChip hash={address} firstCharsCount={6} lastCharsCount={4} />
        </div>
      )}
    </div>
    <CrossChainAmountRow asset={asset} amount={amount} sign={sign} amountClassName={valueClassName} />
  </div>
);

const CopyableText = memo<{ text: string }>(({ text }) => {
  const handleClick = () => {
    navigator.clipboard.writeText(text);
    toastSuccess(t('copiedHash'));
  };

  return (
    <Button onClick={handleClick} className="flex items-center gap-x-1 p-1">
      <span className="text-font-description">{text}</span>
      <IconBase Icon={CopyIcon} size={12} className="text-secondary" />
    </Button>
  );
});

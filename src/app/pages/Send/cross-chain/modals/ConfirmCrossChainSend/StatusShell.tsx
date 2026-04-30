import React, { FC, ReactNode, memo } from 'react';

import clsx from 'clsx';

import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { SupportLink } from 'app/pages/Buy/CryptoExchange/components/SupportLink';
import { CrossChainExchange } from 'app/store/cross-chain-send/state';

import { ExchangeSummaryCard } from './ExchangeSummaryCard';

interface Props {
  exchange: CrossChainExchange;
  backgroundSrc: string;
  heroOuterClassName: string;
  heroInnerClassName: string;
  hero: ReactNode;
  showEstimatedTime?: boolean;
  actionsFlexDirection?: 'row' | 'col';
  actions: ReactNode;
}

export const StatusShell: FC<Props> = memo(
  ({
    exchange,
    backgroundSrc,
    heroOuterClassName,
    heroInnerClassName,
    hero,
    showEstimatedTime,
    actionsFlexDirection,
    actions
  }) => (
    <>
      <div className="flex-1 overflow-y-auto px-4 pt-3 flex flex-col items-stretch">
        <div className={clsx('relative -mx-4 -mt-3 overflow-hidden', heroOuterClassName)}>
          <div
            aria-hidden
            style={{ backgroundImage: `url(${backgroundSrc})` }}
            className="absolute inset-0 bg-no-repeat bg-cover bg-center pointer-events-none"
          />
          <div className={clsx('relative', heroInnerClassName)}>{hero}</div>
        </div>

        <ExchangeSummaryCard
          fromAsset={exchange.fromAsset}
          toAsset={exchange.toAsset}
          fromAmount={exchange.fromAmount}
          toAmountEstimated={exchange.toAmountEstimated}
          toAmountActual={exchange.toAmountActual}
          senderAddress={exchange.senderAddress}
          recipient={exchange.recipient}
          exolixId={exchange.id}
          depositTxHash={exchange.sourceTxHash ?? exchange.hashIn?.hash ?? undefined}
          showEstimatedTime={showEstimatedTime}
        />

        <div className="mt-4">
          <SupportLink />
        </div>
      </div>

      <ActionsButtonsBox flexDirection={actionsFlexDirection}>{actions}</ActionsButtonsBox>
    </>
  )
);

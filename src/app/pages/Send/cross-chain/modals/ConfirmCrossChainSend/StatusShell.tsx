import React, { FC, ReactNode, memo } from 'react';

import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { SupportLink } from 'app/pages/Buy/CryptoExchange/components/SupportLink';
import { CrossChainExchange } from 'app/store/cross-chain-send/state';

import { ExchangeSummaryCard } from './ExchangeSummaryCard';
import { StatusHeroRegion } from './StatusHeroRegion';

interface Props {
  exchange: CrossChainExchange;
  backgroundSrc: string;
  heroOuterClassName: string;
  heroInnerClassName: string;
  hero: ReactNode;
  showEstimatedTime?: boolean;
  /** When provided, replaces the default ExchangeSummaryCard. */
  body?: ReactNode;
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
    body,
    actionsFlexDirection,
    actions
  }) => (
    <>
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-3 pb-4 flex flex-col items-stretch">
        <StatusHeroRegion
          backgroundSrc={backgroundSrc}
          outerClassName={heroOuterClassName}
          innerClassName={heroInnerClassName}
        >
          {hero}
        </StatusHeroRegion>

        {body ?? (
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
            sourceChainKind={exchange.sourceChainKind}
            sourceChainId={exchange.sourceChainId}
            showEstimatedTime={showEstimatedTime}
          />
        )}

        <div className="mt-4">
          <SupportLink />
        </div>
      </div>

      <ActionsButtonsBox flexDirection={actionsFlexDirection}>{actions}</ActionsButtonsBox>
    </>
  )
);

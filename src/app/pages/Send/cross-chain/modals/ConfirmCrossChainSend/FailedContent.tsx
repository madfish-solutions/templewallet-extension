import React, { FC } from 'react';

import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as XCircleFill } from 'app/icons/base/x_circle_fill.svg';
import { useCrossChainExchangeSelector } from 'app/store/cross-chain-send/selectors';
import { OrderStatusEnum } from 'lib/apis/exolix/types';
import { T, t } from 'lib/i18n';

import backgroundFailedSrc from '../../assets/background-failed.svg?url';

import { RefundedContent } from './RefundedContent';
import { StatusShell } from './StatusShell';

interface Props {
  exchangeId: string;
  onClose: EmptyFn;
  onTryAgain: EmptyFn;
}

export const FailedContent: FC<Props> = ({ exchangeId, onClose, onTryAgain }) => {
  const exchange = useCrossChainExchangeSelector(exchangeId);
  if (!exchange) return null;

  if (exchange.exolixStatus === OrderStatusEnum.REFUNDED) {
    return <RefundedContent exchange={exchange} onClose={onClose} />;
  }

  const isOverdue = exchange.exolixStatus === OrderStatusEnum.OVERDUE;
  const heading = isOverdue ? t('orderExpiredCrossChain') : t('couldNotComplete');
  const description = isOverdue ? t('orderExpiredCrossChainDescription') : t('couldNotCompleteDescription');

  return (
    <StatusShell
      exchange={exchange}
      backgroundSrc={backgroundFailedSrc}
      heroOuterClassName="h-48 px-4 pb-2"
      heroInnerClassName="flex flex-col items-center gap-y-3 pb-4 pt-6"
      showEstimatedTime={false}
      hero={
        <>
          <XCircleFill width={58} height={58} className="text-error fill-current" />
          <p className="text-font-regular-bold">{heading}</p>
          <p className="text-font-description text-grey-1 text-center whitespace-pre-line">{description}</p>
        </>
      }
      actionsFlexDirection="row"
      actions={
        <>
          <StyledButton size="L" className="w-full" color="primary-low" onClick={onClose}>
            <T id="close" />
          </StyledButton>
          <StyledButton size="L" className="w-full" color="primary" onClick={onTryAgain}>
            <T id="tryAgain" />
          </StyledButton>
        </>
      }
    />
  );
};

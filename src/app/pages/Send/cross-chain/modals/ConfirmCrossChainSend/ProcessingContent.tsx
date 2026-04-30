import React, { FC, useEffect } from 'react';

import { StyledButton } from 'app/atoms/StyledButton';
import { useCrossChainExchangeSelector } from 'app/store/cross-chain-send/selectors';
import { CrossChainExchange, CrossChainPhase } from 'app/store/cross-chain-send/state';
import { T } from 'lib/i18n';

import backgroundProcessingSrc from '../../assets/background-processing.svg?url';

import { CrossChainStepper } from './CrossChainStepper';
import { StatusShell } from './StatusShell';
import { ConfirmCrossChainStep } from './types';

const TERMINAL_PHASES: CrossChainPhase[] = ['COMPLETED', 'FAILED'];

interface Props {
  exchangeId: string;
  onStepChange: (step: ConfirmCrossChainStep, exchangeId: string) => void;
  onClose: EmptyFn;
}

export const ProcessingContent: FC<Props> = ({ exchangeId, onStepChange, onClose }) => {
  const exchange = useCrossChainExchangeSelector(exchangeId);

  useEffect(() => {
    if (!exchange) return;
    if (exchange.phase === 'COMPLETED') onStepChange(ConfirmCrossChainStep.Completed, exchangeId);
    else if (exchange.phase === 'FAILED') onStepChange(ConfirmCrossChainStep.Failed, exchangeId);
  }, [exchange, exchangeId, onStepChange]);

  if (!exchange) return null;

  return <ProcessingBody exchange={exchange} onClose={onClose} />;
};

interface BodyProps {
  exchange: CrossChainExchange;
  onClose: EmptyFn;
}

const ProcessingBody: FC<BodyProps> = ({ exchange, onClose }) => {
  const isTerminal = TERMINAL_PHASES.includes(exchange.phase);

  return (
    <StatusShell
      exchange={exchange}
      backgroundSrc={backgroundProcessingSrc}
      heroOuterClassName="h-39 px-6 pt-3 pb-2 flex justify-center items-center"
      heroInnerClassName="flex flex-col gap-y-2.5 flex-1"
      hero={
        <>
          <CrossChainStepper phase={exchange.phase} />
          <p className="text-font-small text-grey-1 text-center">
            <T id="processingFailureNote" />
          </p>
        </>
      }
      showEstimatedTime
      actions={
        <>
          {!isTerminal && (
            <p className="text-font-small text-grey-1 text-center">
              <T id="feelFreeToCloseNote" />
            </p>
          )}
          <StyledButton size="L" color="primary" onClick={onClose}>
            <T id="close" />
          </StyledButton>
        </>
      }
    />
  );
};

import React, { FC } from 'react';

import { StyledButton } from 'app/atoms/StyledButton';
import { useCrossChainExchangeSelector } from 'app/store/cross-chain-send/selectors';
import { isTerminalPhase } from 'lib/cross-chain';
import { T } from 'lib/i18n';

import backgroundProcessingSrc from '../../assets/background-processing.svg?url';

import { CrossChainStepper } from './CrossChainStepper';
import { StatusShell } from './StatusShell';

interface Props {
  exchangeId: string;
  onClose: EmptyFn;
}

export const ProcessingContent: FC<Props> = ({ exchangeId, onClose }) => {
  const exchange = useCrossChainExchangeSelector(exchangeId);
  if (!exchange) return null;

  const isTerminal = isTerminalPhase(exchange.phase);

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

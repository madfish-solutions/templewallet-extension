import React, { FC } from 'react';

import { DoneAnimation, backgroundSuccessSrc } from 'app/atoms/done-animation';
import { StyledButton } from 'app/atoms/StyledButton';
import { useCrossChainExchangeSelector } from 'app/store/cross-chain-send/selectors';
import { T } from 'lib/i18n';

import { StatusShell } from './StatusShell';

interface Props {
  exchangeId: string;
  onClose: EmptyFn;
}

export const CompletedContent: FC<Props> = ({ exchangeId, onClose }) => {
  const exchange = useCrossChainExchangeSelector(exchangeId);
  if (!exchange) return null;

  return (
    <StatusShell
      exchange={exchange}
      backgroundSrc={backgroundSuccessSrc}
      heroOuterClassName="h-39 px-4 pb-2"
      heroInnerClassName="flex flex-col items-center gap-y-3 pb-4 pt-6"
      showEstimatedTime={false}
      hero={
        <>
          <DoneAnimation hideBackground animationSize={58} />
          <p className="text-font-regular-bold">
            <T id="completed" />
          </p>
        </>
      }
      actions={
        <StyledButton size="L" color="primary" onClick={onClose}>
          <T id="done" />
        </StyledButton>
      }
    />
  );
};

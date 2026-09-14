import type { FC } from 'react';

import { StyledButton } from 'app/atoms/StyledButton';
import { T } from 'lib/i18n';
import type { EvmChain } from 'temple/front';

import type { useAlchemySwapBatch } from './hooks/useAlchemySwapBatch';

interface Props {
  batch: ReturnType<typeof useAlchemySwapBatch>;
  network: EvmChain;
  submitLoading: boolean;
  onUseLegacyFlow?: EmptyFn;
}

export const AlchemyBatchControls: FC<Props> = ({ batch, submitLoading, onUseLegacyFlow }) => (
  <div className="mt-4 flex flex-col gap-2 text-font-description">
    {batch.quote?.prepared.type === 'array' && (
      <p>
        <T id="alchemyDelegationNotice" />
      </p>
    )}
    <p>
      <T id="alchemyFeeNotice" />
    </p>
    {batch.expired && !batch.submitted && (
      <p className="text-error">
        <T id="alchemyQuoteExpired" />
      </p>
    )}
    {batch.submitted && (
      <p>
        <T id={batch.replacementReady ? 'alchemyReplacementNotice' : 'alchemyPendingNotice'} />
      </p>
    )}
    {!batch.submitted && (
      <StyledButton color="primary-low" size="S" disabled={submitLoading || batch.busy} onClick={onUseLegacyFlow}>
        <T id="alchemyUseSeparateConfirmations" />
      </StyledButton>
    )}
  </div>
);

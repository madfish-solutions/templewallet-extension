import type { FC } from 'react';

import { StyledButton } from 'app/atoms/StyledButton';
import type { AlchemyFeeToken } from 'lib/evm/alchemy/types';
import { T } from 'lib/i18n';
import type { EvmChain } from 'temple/front';

import type { useAlchemySwapBatch } from './hooks/useAlchemySwapBatch';

interface Props {
  batch: ReturnType<typeof useAlchemySwapBatch>;
  network: EvmChain;
  submitLoading: boolean;
  onUseLegacyFlow?: EmptyFn;
  onFeeTokenSelect: SyncFn<AlchemyFeeToken | undefined>;
}

export const AlchemyBatchControls: FC<Props> = ({
  batch,
  network,
  submitLoading,
  onUseLegacyFlow,
  onFeeTokenSelect
}) => (
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
    {batch.feeTokens.length > 0 && (
      <label>
        <T id="alchemyPayFeeWith" />
        <select
          className="w-full mt-1 rounded-lg border border-lines p-2"
          value={batch.feeToken?.address ?? ''}
          disabled={batch.submitted || batch.busy || submitLoading}
          onChange={event => onFeeTokenSelect(batch.feeTokens.find(token => token.address === event.target.value))}
        >
          <option value="">{network.currency.symbol}</option>
          {batch.feeTokens.map(token => (
            <option key={token.address} value={token.address}>
              {token.symbol}
            </option>
          ))}
        </select>
      </label>
    )}
    {!batch.submitted && (
      <StyledButton color="primary-low" size="S" disabled={submitLoading || batch.busy} onClick={onUseLegacyFlow}>
        <T id="alchemyUseSeparateConfirmations" />
      </StyledButton>
    )}
  </div>
);

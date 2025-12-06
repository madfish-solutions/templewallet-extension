import React, { memo, useMemo } from 'react';

import { StyledButton } from 'app/atoms/StyledButton';
import { useRichFormatTooltip } from 'app/hooks/use-rich-format-tooltip';
import { T, t } from 'lib/i18n';
import { formatDuration } from 'lib/i18n/core';
import { ONE_DAY_SECONDS } from 'lib/utils/numbers';

import { EthStakingStats } from '../types';

const notReadyClaimTooltipProps = {
  trigger: 'mouseenter',
  hideOnClick: true,
  animation: 'shift-away-subtle',
  placement: 'bottom-end'
} as const;
const wrapperFactory = () => {
  const element = document.createElement('div');
  element.className = 'max-w-60';

  return element;
};

export const NotReadyClaimButton = memo<{ stats: EthStakingStats }>(({ stats }) => {
  const { validator_withdraw_time, validator_exit_time, lastUnstakeTimestamp } = stats;
  const notReadyClaimTooltipContent = useMemo(() => {
    const secondsLeft =
      validator_exit_time +
      validator_withdraw_time -
      (lastUnstakeTimestamp ? Math.floor((Date.now() - new Date(lastUnstakeTimestamp).getTime()) / 1000) : 0);

    return t('notReadyClaimTooltip', formatDuration(secondsLeft, secondsLeft < ONE_DAY_SECONDS ? ['hours'] : ['days']));
  }, [validator_exit_time, validator_withdraw_time, lastUnstakeTimestamp]);

  const tooltipRef = useRichFormatTooltip<HTMLDivElement>(
    notReadyClaimTooltipProps,
    wrapperFactory,
    notReadyClaimTooltipContent
  );

  return (
    <div ref={tooltipRef}>
      <StyledButton color="primary" size="S" disabled>
        <T id="claim" />
      </StyledButton>
    </div>
  );
});

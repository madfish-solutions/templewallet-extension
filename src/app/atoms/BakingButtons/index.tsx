import React, { memo, useCallback } from 'react';

import { TestIDProperty } from 'lib/analytics';
import { T, t } from 'lib/i18n';
import { useConfirm } from 'lib/ui/dialog';

import { StyledButton } from '../StyledButton';

interface RedelegateButtonProps extends TestIDProperty {
  disabled: boolean;
  staked: boolean;
  onConfirm?: EmptyFn;
}

export const RedelegateButton = memo<RedelegateButtonProps>(({ disabled, staked, onConfirm, testID }) => {
  const customConfirm = useConfirm();

  const handleClick = useCallback(() => {
    if (staked) {
      customConfirm({
        title: t('importantNotice'),
        description: t('redelegationNoticeDescription'),
        confirmButtonText: t('okGotIt'),
        showCancelButton: false
      }).then(confirmed => {
        if (confirmed) onConfirm?.();
      });
    } else {
      onConfirm?.();
    }
  }, [customConfirm, onConfirm, staked]);

  return (
    <StyledButton disabled={disabled} color="secondary-low" size="S" testID={testID} onClick={handleClick}>
      <T id="reDelegate" />
    </StyledButton>
  );
});

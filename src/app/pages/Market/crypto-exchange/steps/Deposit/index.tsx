import React, { memo } from 'react';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { ActionsButtonsBox } from 'app/atoms/PageModal';
import { StyledButton } from 'app/atoms/StyledButton';
import { t, T } from 'lib/i18n';

import { CaptionAlert } from '../../../../../atoms';
import { StepLabel } from '../../components/StepLabel';
import { Stepper, Steps } from '../../components/Stepper';

import { DepositAddressBlock } from './components/DepositAddressBlock';
import { ExpiresInBlock } from './components/ExpiresInBlock';

interface Props {
  setExchangeStep: SyncFn<Steps>;
}

export const Deposit = memo<Props>(() => {
  return (
    <FadeTransition>
      <div className="flex-1 pt-4 px-4 flex flex-col overflow-y-auto">
        <Stepper currentStep={1} />

        <StepLabel title="deposit" description="depositDescription" />

        <CaptionAlert type="warning" message={t('depositDisclaimer')} />

        <ExpiresInBlock className="mt-4" />

        <DepositAddressBlock className="mt-6 mb-4" />
      </div>

      <ActionsButtonsBox>
        <StyledButton size="L" color="primary">
          <T id="cancelOrder" />
        </StyledButton>
      </ActionsButtonsBox>
    </FadeTransition>
  );
});

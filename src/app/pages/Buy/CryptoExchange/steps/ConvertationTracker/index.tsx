import React, { memo, useEffect } from 'react';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { ActionsButtonsBox } from 'app/atoms/PageModal';
import { StyledButton } from 'app/atoms/StyledButton';
import { OrderStatusEnum } from 'lib/apis/exolix/types';
import { T } from 'lib/i18n';

import { StepLabel } from '../../components/StepLabel';
import { Stepper } from '../../components/Stepper';
import { SupportLink } from '../../components/SupportLink';
import { useCryptoExchangeDataState } from '../../context';
import { useTopUpUpdate } from '../../hooks/use-top-up-update';

import { CompletedStatusInfoBlocks } from './components/CompletedStatusInfoBlocks';
import { InProgressStatusInfoBlocks } from './components/InProgressStatusInfoBlocks';

export const ConvertationTracker = memo(() => {
  const { exchangeData, step, setStep, reset } = useCryptoExchangeDataState();

  useTopUpUpdate();

  useEffect(() => {
    if (!exchangeData) return;

    switch (exchangeData.status) {
      case OrderStatusEnum.OVERDUE:
        setStep(1);
        break;
      case OrderStatusEnum.REFUNDED:
        reset();
        break;
      case OrderStatusEnum.SUCCESS:
        setStep(3);
    }
  }, [exchangeData, reset, setStep]);

  const isSuccess = step === 3;

  return (
    <FadeTransition>
      <div className="flex-1 pt-4 px-4 flex flex-col overflow-y-auto">
        <Stepper currentStep={step} />

        <StepLabel
          title={isSuccess ? 'completed' : 'convertation'}
          description={isSuccess ? 'completedDescription' : 'convertationDescription'}
          status={isSuccess ? 'done' : 'loading'}
        />

        {isSuccess ? <CompletedStatusInfoBlocks /> : <InProgressStatusInfoBlocks />}

        <SupportLink className="mt-6 mb-7" />
      </div>

      {isSuccess && (
        <ActionsButtonsBox>
          <StyledButton size="L" color="primary" onClick={reset}>
            <T id="newOrder" />
          </StyledButton>
        </ActionsButtonsBox>
      )}
    </FadeTransition>
  );
});

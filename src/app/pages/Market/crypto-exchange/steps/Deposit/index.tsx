import React, { memo, useCallback } from 'react';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { CaptionAlert, IconBase } from 'app/atoms';
import Money from 'app/atoms/Money';
import { ActionsButtonsBox } from 'app/atoms/PageModal';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as CopyIcon } from 'app/icons/base/copy.svg';
import { toastSuccess } from 'app/toaster';
import { t, T } from 'lib/i18n';

import { CurrencyIcon } from '../../components/CurrencyIcon';
import { InfoContainer, InfoRaw } from '../../components/InfoBlock';
import { StepLabel } from '../../components/StepLabel';
import { Stepper } from '../../components/Stepper';
import { SupportLink } from '../../components/SupportButton';
import { useCryptoExchangeDataState } from '../../context';
import { useTopUpUpdate } from '../../hooks/use-top-up-update';

import { DepositAddressBlock } from './components/DepositAddressBlock';
import { ExpiresInBlock } from './components/ExpiresInBlock';

export const Deposit = memo(() => {
  useTopUpUpdate();

  const { setExchangeData, setStep } = useCryptoExchangeDataState();

  const cancelOrder = useCallback(() => {
    setStep(0);
    setExchangeData(null);
  }, [setExchangeData, setStep]);

  return (
    <FadeTransition>
      <div className="flex-1 pt-4 px-4 flex flex-col overflow-y-auto">
        <Stepper currentStep={1} />

        <StepLabel title="deposit" description="depositDescription" />

        <CaptionAlert type="warning" message={t('depositDisclaimer')} />

        <ExpiresInBlock className="mt-4" />

        <DepositAddressBlock className="mt-6 mb-4" />

        <InfoBlock />

        <SupportLink className="mt-6 mb-7" />
      </div>

      <ActionsButtonsBox>
        <StyledButton size="L" color="red-low" onClick={cancelOrder}>
          <T id="cancelOrder" />
        </StyledButton>
      </ActionsButtonsBox>
    </FadeTransition>
  );
});

const InfoBlock = memo(() => {
  const { exchangeData } = useCryptoExchangeDataState();

  const handleCopyTxId = useCallback(() => {
    window.navigator.clipboard.writeText(exchangeData!.id);
    toastSuccess('Copied');
  }, [exchangeData]);

  if (!exchangeData) return null;

  return (
    <InfoContainer>
      <InfoRaw bottomSeparator title="youGet">
        <div className="flex flex-row gap-x-0.5">
          <span className="p-1 text-font-description-bold">
            <Money smallFractionFont={false} tooltipPlacement="bottom">
              {exchangeData.amount}
            </Money>{' '}
            {exchangeData.coinFrom.coinCode}
          </span>
          <CurrencyIcon src={exchangeData.coinFrom.icon} code={exchangeData.coinFrom.coinCode} size={24} />
        </div>
      </InfoRaw>
      <InfoRaw bottomSeparator title="exchangeRate">
        <span className="p-1 text-font-description">
          <span>{`1 ${exchangeData.coinFrom.coinCode} = `}</span>
          <Money
            cryptoDecimals={exchangeData.rate.length > 12 ? 2 : 6}
            smallFractionFont={false}
            tooltipPlacement="bottom"
          >
            {exchangeData.rate}
          </Money>{' '}
          {exchangeData.coinTo.coinCode}
        </span>
      </InfoRaw>
      <InfoRaw title="transactionId">
        <div className="flex flex-row justify-center items-center gap-x-0.5">
          <span className="p-1 text-font-description max-w-32 truncate">{exchangeData.id}</span>
          <IconBase Icon={CopyIcon} className="cursor-pointer text-secondary" onClick={handleCopyTxId} />
        </div>
      </InfoRaw>
    </InfoContainer>
  );
});

import React, { FC, useCallback, useLayoutEffect } from 'react';

import { Controller, useFormContext } from 'react-hook-form-v7';

import AssetField from 'app/atoms/AssetField';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { StyledButton } from 'app/atoms/StyledButton';
import { useFormAnalytics } from 'lib/analytics';
import { t, T } from 'lib/i18n';

import { StepLabel } from '../../../components/StepLabel';
import { Stepper } from '../../../components/Stepper';
import { defaultModalState, ModalState } from '../../../config';
import { getCurrencyDisplayCode } from '../../../utils';
import { CryptoExchangeFormData } from '../types';

import { InfoCard } from './InfoCard';
import { SelectCurrencyButton } from './SelectCurrencyButton';
import { SelectTokenContent } from './SelectCurrencyContent';

//const VALUE_PLACEHOLDER = '---';
const EXOLIX_DECIMALS = 8;

interface Props {
  setModalState: SyncFn<ModalState>;
  setModalContent: SyncFn<SelectTokenContent>;
}

export const FormContent: FC<Props> = ({ setModalState, setModalContent }) => {
  const formAnalytics = useFormAnalytics('ExolixOrderCreationForm');

  const { control, watch, handleSubmit, formState } = useFormContext<CryptoExchangeFormData>();
  const { isSubmitting } = formState;

  const inputCurrency = watch('inputCurrency');
  const outputCurrency = watch('outputCurrency');

  useLayoutEffect(() => void setModalState(defaultModalState), []);

  const selectInputCurrency = useCallback(() => setModalContent('send'), []);
  const selectOutputCurrency = useCallback(() => setModalContent('get'), []);

  const onSubmit = useCallback(async () => {
    if (isSubmitting) return;

    formAnalytics.trackSubmit();

    formAnalytics.trackSubmitSuccess();
  }, [formAnalytics, isSubmitting]);

  return (
    <>
      <form
        id="create-order-form"
        className="flex-1 pt-4 px-4 flex flex-col overflow-y-auto"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Stepper currentStep={0} />

        <StepLabel title="exchangeDetails" description="exchangeDetailsDescription" />

        <Controller
          name="inputValue"
          control={control}
          //rules={{ validate: validateSendValue }}
          render={({ field: { value, onChange, onBlur } }) => (
            <AssetField
              value={value}
              onBlur={onBlur}
              onChange={v => onChange(v ?? '')}
              assetDecimals={EXOLIX_DECIMALS}
              rightSideComponent={<SelectCurrencyButton currency={inputCurrency} onClick={selectInputCurrency} />}
              rightSideContainerStyle={{ right: 2 }}
              style={{ paddingRight: 158 }}
              underneathComponent={
                <div className="flex items-center text-font-description text-grey-1 py-1">
                  <T id="min" />{' '}
                  <span className="text-font-num-12 text-secondary ml-0.5 mr-4">
                    0.020534 {getCurrencyDisplayCode(inputCurrency)}
                  </span>
                  <T id="max" />:{' '}
                  <span className="text-font-num-12 text-secondary ml-0.5">
                    2710.934943 {getCurrencyDisplayCode(inputCurrency)}
                  </span>
                </div>
              }
              label={t('send')}
              placeholder="0.00"
              containerClassName="pb-7"
            />
          )}
        />

        <Controller
          name="outputValue"
          control={control}
          //rules={{ validate: validateSendValue }}
          render={({ field: { value } }) => (
            <AssetField
              readOnly
              value={value}
              assetDecimals={EXOLIX_DECIMALS}
              rightSideComponent={<SelectCurrencyButton currency={outputCurrency} onClick={selectOutputCurrency} />}
              rightSideContainerStyle={{ right: 2 }}
              style={{ paddingRight: 158 }}
              label={t('get')}
              placeholder="0.00"
              shouldShowErrorCaption={false}
              containerClassName="pb-5"
            />
          )}
        />

        <InfoCard exchangeRate="1 ETH ≈ 78.67 TEZ" />
      </form>

      <ActionsButtonsBox>
        <StyledButton type="submit" id="create-order-form" size="L" color="primary">
          <T id="exchange" />
        </StyledButton>
      </ActionsButtonsBox>
    </>
  );
};

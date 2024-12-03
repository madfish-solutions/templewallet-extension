import React, { FC, memo, useCallback } from 'react';

import { Controller, useForm } from 'react-hook-form-v7';

import { Button, IconBase } from 'app/atoms';
import AssetField from 'app/atoms/AssetField';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as CompactDown } from 'app/icons/base/compact_down.svg';
import { StaticCurrencyImage } from 'app/templates/TopUpInput/StaticCurrencyImage';
import { useFormAnalytics } from 'lib/analytics';
import { t, T } from 'lib/i18n';

import { StepLabel } from '../components/StepLabel';
import { Stepper } from '../components/Stepper';
import { EXOLIX_PRIVICY_LINK, EXOLIX_TERMS_LINK, INITIAL_COIN_FROM, INITIAL_COIN_TO } from '../config';

interface FormData {
  send: string;
  get: string;
}

//const VALUE_PLACEHOLDER = '---';
const EXOLIX_DECIMALS = 8;

export const OrderCreation: FC = () => {
  const formAnalytics = useFormAnalytics('ExolixOrderCreationForm');

  const { handleSubmit, control, formState } = useForm<FormData>({
    mode: 'onSubmit',
    reValidateMode: 'onChange'
  });
  const { isSubmitting } = formState;

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
          name="send"
          control={control}
          //rules={{ validate: validateSendValue }}
          render={({ field: { value, onChange, onBlur } }) => (
            <AssetField
              value={value}
              onBlur={onBlur}
              onChange={v => onChange(v ?? '')}
              assetDecimals={EXOLIX_DECIMALS}
              rightSideComponent={
                <Button className="cursor-pointer flex justify-between items-center bg-white py-1 px-2.5 rounded-lg w-[144px] h-[44px]">
                  <div className="flex items-center gap-x-2">
                    <StaticCurrencyImage currencyCode={INITIAL_COIN_FROM.code} imageSrc={INITIAL_COIN_FROM.icon} />
                    <div className="text-start">
                      <p className="text-font-description-bold">ETH</p>
                      <p className="text-font-num-12 text-grey-1 w-[52px] truncate">Ethereum</p>
                    </div>
                  </div>
                  <IconBase Icon={CompactDown} className="text-primary" size={16} />
                </Button>
              }
              rightSideContainerStyle={{ right: 2 }}
              underneathComponent={
                <div className="flex items-center text-font-description text-grey-1 py-1">
                  <T id="min" /> <span className="text-font-num-12 text-secondary ml-0.5 mr-4">0.020534 ETH</span>
                  <T id="max" />: <span className="text-font-num-12 text-secondary ml-0.5">2710.934943 ETH</span>
                </div>
              }
              label={t('send')}
              placeholder="0.00"
              containerClassName="pb-7"
            />
          )}
        />

        <Controller
          name="get"
          control={control}
          //rules={{ validate: validateSendValue }}
          render={({ field: { value } }) => (
            <AssetField
              readOnly
              value={value}
              assetDecimals={EXOLIX_DECIMALS}
              rightSideComponent={
                <Button className="cursor-pointer flex justify-between items-center bg-white py-1 px-2.5 rounded-lg w-[144px] h-[44px]">
                  <div className="flex items-center gap-x-2">
                    <StaticCurrencyImage currencyCode={INITIAL_COIN_TO.code} imageSrc={INITIAL_COIN_TO.icon} />
                    <div className="text-start">
                      <p className="text-font-description-bold">TEZ</p>
                      <p className="text-font-num-12 text-grey-1 w-[52px] truncate">Tezos</p>
                    </div>
                  </div>
                  <IconBase Icon={CompactDown} className="text-primary" size={16} />
                </Button>
              }
              rightSideContainerStyle={{ right: 2 }}
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

const InfoCard = memo<{ exchangeRate: string }>(({ exchangeRate }) => (
  <div className="flex flex-col pt-2 p-4 mb-8 rounded-lg shadow-bottom border-0.5 border-transparent">
    <div className="py-3 flex flex-row justify-between items-center border-b-0.5 border-lines text-font-description">
      <p className="p-1 text-grey-1">
        <T id="exchangeRate" />
      </p>
      <p className="p-1">{exchangeRate}</p>
    </div>

    <div className="pt-2 px-1 flex flex-col gap-y-2 text-font-small text-grey-1">
      <p>
        <T
          id="privacyAndPolicyLinks"
          substitutions={[
            <T id="exchange" key="buttonContent" />,
            <a
              className="text-font-small-bold underline"
              rel="noreferrer"
              href={EXOLIX_TERMS_LINK}
              target="_blank"
              key="termsOfUse"
            >
              <T id="termsOfUse" />
            </a>,
            <a
              className="text-font-small-bold underline"
              rel="noreferrer"
              href={EXOLIX_PRIVICY_LINK}
              target="_blank"
              key="privacy"
            >
              <T id="privacyPolicy" />
            </a>
          ]}
        />
      </p>
      <p>
        <T id="warningTopUpServiceMessage" />
      </p>
    </div>
  </div>
));

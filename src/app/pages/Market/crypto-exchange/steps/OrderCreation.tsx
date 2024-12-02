import React, { FC, memo } from 'react';

import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { StyledButton } from 'app/atoms/StyledButton';
import { T } from 'lib/i18n';

import { StepDescription } from '../components/StepDescription';
import { Stepper } from '../components/Stepper';
import { EXOLIX_PRIVICY_LINK, EXOLIX_TERMS_LINK } from '../config';

export const OrderCreation: FC = () => {
  return (
    <>
      <form id="create-order-form" className="flex-1 pt-4 px-4 flex flex-col overflow-y-auto">
        <Stepper currentStep={0} />

        <StepDescription title="exchangeDetails" description="exchangeDetailsDescription" />

        <ExchangeRateCard exchangeRate="1 ETH ≈ 78.67 TEZ" />
      </form>

      <ActionsButtonsBox>
        <StyledButton type="submit" form="create-order-form" size="L" color="primary">
          <T id="exchange" />
        </StyledButton>
      </ActionsButtonsBox>
    </>
  );
};

const ExchangeRateCard = memo<{ exchangeRate: string }>(({ exchangeRate }) => (
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

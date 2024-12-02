import React, { memo, useState } from 'react';

import { Anchor, Stepper } from 'app/atoms';
import PageLayout from 'app/layouts/PageLayout';
import ApproveStep from 'app/pages/Buy/Crypto/Exolix/steps/ApproveStep';
import ExchangeStep from 'app/pages/Buy/Crypto/Exolix/steps/ExchangeStep';
import InitialStep from 'app/pages/Buy/Crypto/Exolix/steps/InitialStep';
import { T, t } from 'lib/i18n';
import { useStorage } from 'lib/temple/front';
import { UNDER_DEVELOPMENT_MSG } from 'temple/evm/under_dev_msg';
import { useAccountAddressForTezos } from 'temple/front';

import { EXOLIX_CONTACT_LINK } from '../../../Market/crypto-exchange/config';

import { ExolixSelectors } from './Exolix.selectors';
import { ExchangeDataInterface } from './exolix.types';

/**
 * Note: Feature is only available on Tezos Mainnet.
 * TODO: Highlight in UI/UX
 */
const Exolix = memo(() => {
  const publicKeyHash = useAccountAddressForTezos();

  return (
    <PageLayout
      pageTitle={
        <div className="font-medium text-sm">
          <T id="buyWithCrypto" />
        </div>
      }
    >
      {publicKeyHash ? (
        <BuyCryptoContent publicKeyHash={publicKeyHash} />
      ) : (
        <div className="pb-8 text-center max-w-sm mx-auto">{UNDER_DEVELOPMENT_MSG}</div>
      )}
    </PageLayout>
  );
});

export default Exolix;

interface BuyCryptoContentProps {
  publicKeyHash: string;
}

const BuyCryptoContent = memo<BuyCryptoContentProps>(({ publicKeyHash }) => {
  const [step, setStep] = useStorage<number>(`topup_step_state_${publicKeyHash}`, 0);
  const [isError, setIsError] = useState(false);
  const [exchangeData, setExchangeData] = useStorage<ExchangeDataInterface | null>(
    `topup_exchange_data_state_${publicKeyHash}`,
    null
  );

  const CONTACT_LINK_TEST_IDS: Record<number, ExolixSelectors> = {
    2: ExolixSelectors.topupSecondStepSupportButton,
    3: ExolixSelectors.topupThirdStepSupportButton
  };

  const steps = (stepWord => [`${stepWord} 1`, `${stepWord} 2`, `${stepWord} 3`, `${stepWord} 4`])(t('step'));

  return (
    <div className="pb-8 text-center max-w-sm mx-auto">
      <Stepper style={{ marginTop: 8 }} steps={steps} currentStep={step} />
      {step === 0 && (
        <InitialStep
          publicKeyHash={publicKeyHash}
          isError={isError}
          setIsError={setIsError}
          exchangeData={exchangeData}
          setExchangeData={setExchangeData}
          setStep={setStep}
        />
      )}
      {step === 1 && (
        <ApproveStep
          exchangeData={exchangeData}
          setExchangeData={setExchangeData}
          setStep={setStep}
          isError={isError}
          setIsError={setIsError}
        />
      )}
      {(step === 2 || step === 3 || step === 4) && (
        <ExchangeStep
          exchangeData={exchangeData}
          setExchangeData={setExchangeData}
          setStep={setStep}
          step={step}
          isError={isError}
          setIsError={setIsError}
        />
      )}
      {step >= 1 && (
        <Anchor
          href={EXOLIX_CONTACT_LINK}
          rel="noreferrer"
          className="text-blue-500 text-sm mb-8 cursor-pointer inline-block w-auto"
          testID={CONTACT_LINK_TEST_IDS[step] || ExolixSelectors.topupFourthStepSubmitButton}
          treatAsButton={true}
        >
          <T id={'support'} />
        </Anchor>
      )}
    </div>
  );
});

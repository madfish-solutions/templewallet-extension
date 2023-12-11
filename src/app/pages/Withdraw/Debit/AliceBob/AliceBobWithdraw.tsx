import React, { FC, useState } from 'react';

import { Stepper } from 'app/atoms';
import { Anchor } from 'app/atoms/Anchor';
import { ReactComponent as AttentionRedIcon } from 'app/icons/attentionRed.svg';
import PageLayout from 'app/layouts/PageLayout';
import styles from 'app/pages/Buy/Crypto/Exolix/Exolix.module.css';
import { AliceBobOrderInfo, AliceBobOrderStatus } from 'lib/apis/temple';
import { t, T } from 'lib/i18n/react';
import { useAccount, useNetwork, useStorage } from 'lib/temple/front';
import { TempleAccountType } from 'lib/temple/types';
import { Redirect } from 'lib/woozie';

import { WithdrawSelectors } from '../../Withdraw.selectors';

import { InitialStep } from './steps/InitialStep';
import { OrderStatusStep } from './steps/OrderStatusStep';
import { SellStep } from './steps/SellStep';

const ALICE_BOB_PRIVACY_LINK =
  'https://oval-rhodium-33f.notion.site/Privacy-Policy-Abex-Eng-d70fa7cc134341a3ac4fd04816358b9e';
const ALICE_BOB_TERMS_LINK =
  'https://oval-rhodium-33f.notion.site/End-User-License-Agreement-Abex-Eng-6124123e256d456a83cffc3b2977c4dc';
const ALICE_BOB_CONTACT_LINK = 'https://t.me/alicebobhelp';

export const AliceBobWithdraw: FC = () => {
  const network = useNetwork();
  const account = useAccount();
  const { publicKeyHash } = account;

  const [step, setStep] = useStorage<number>(`alice_bob_withdraw_step_state_${publicKeyHash}`, 0);
  const [isApiError, setIsApiError] = useState(false);
  const [orderInfo, setOrderInfo] = useStorage<AliceBobOrderInfo | null>(
    `alice_bob_withdraw_order_state_${publicKeyHash}`,
    null
  );

  if (network.type !== 'main' || account.type === TempleAccountType.WatchOnly) {
    return <Redirect to={'/'} />;
  }

  const steps = (stepWord => [`${stepWord} 1`, `${stepWord} 2`, `${stepWord} 3`])(t('step'));

  return (
    <PageLayout
      pageTitle={
        <div className="font-medium text-sm">
          <T id="sellTez" />
        </div>
      }
    >
      <div className="pb-8 text-center max-w-sm mx-auto">
        <Stepper
          steps={steps}
          currentStep={step}
          completed={orderInfo?.status === AliceBobOrderStatus.COMPLETED}
          style={{ maxWidth: 250, marginTop: 8 }}
        />

        {isApiError && (
          <div className="flex w-full justify-center my-6 text-red-600" style={{ fontSize: 17 }}>
            <AttentionRedIcon />
            <h3 className="ml-1">
              <T id="serviceIsUnavailable" />
            </h3>
          </div>
        )}

        {step === 0 && (
          <InitialStep
            isApiError={isApiError}
            setStep={setStep}
            setOrderInfo={setOrderInfo}
            setIsApiError={setIsApiError}
          />
        )}

        {orderInfo && step === 1 && (
          <SellStep
            orderInfo={orderInfo}
            isApiError={isApiError}
            setStep={setStep}
            setOrderInfo={setOrderInfo}
            setIsApiError={setIsApiError}
          />
        )}

        {orderInfo && step === 2 && (
          <>
            <OrderStatusStep
              orderInfo={orderInfo}
              isApiError={isApiError}
              setStep={setStep}
              setOrderInfo={setOrderInfo}
              setIsApiError={setIsApiError}
            />

            <Anchor
              href={ALICE_BOB_CONTACT_LINK}
              rel="noreferrer"
              className="text-blue-500 text-sm mt-6 cursor-pointer inline-block w-auto"
              testID={WithdrawSelectors.aliceBobSupportButton}
            >
              <T id={'support'} />
            </Anchor>
          </>
        )}

        <div className="text-gray-700">
          {step === 0 && (
            <p className="mt-6">
              <T
                id="privacyAndPolicyLinks"
                substitutions={[
                  <T id={'next'} />,
                  <a className={styles['link']} rel="noreferrer" href={ALICE_BOB_PRIVACY_LINK} target="_blank">
                    <T id={'termsOfUse'} />
                  </a>,
                  <a className={styles['link']} rel="noreferrer" href={ALICE_BOB_TERMS_LINK} target="_blank">
                    <T id={'privacyPolicy'} />
                  </a>
                ]}
              />
            </p>
          )}
          <p className="my-6">
            <T id="warningTopUpServiceMessage" />
          </p>
        </div>
      </div>
    </PageLayout>
  );
};

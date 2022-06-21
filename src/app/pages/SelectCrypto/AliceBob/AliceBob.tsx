import React, { ChangeEvent, useCallback, useMemo, useState } from 'react';

import { useAnalyticsState } from '../../../../lib/analytics/use-analytics-state.hook';
import { T } from '../../../../lib/i18n/react';
import makeBuildQueryFn from '../../../../lib/makeBuildQueryFn';
import { useAccount } from '../../../../lib/temple/front';
import FormSubmitButton from '../../../atoms/FormSubmitButton';
import { TopUpInput } from '../../../atoms/TopUpInput/TopUpInput';
import PageLayout from '../../../layouts/PageLayout';
import styles from '../../BuyCrypto/BuyCrypto.module.css';
import { SelectCryptoSelectors } from '../SelectCrypto.selectors';

const MIN_UAH_EXCHANGE_AMOUNT = 500;
const MAX_UAH_EXCHANGE_AMOUNT = 29500;

const buildQuery = makeBuildQueryFn<Record<string, string>, any>('https://temple-api.stage.madservice.xyz');
const getSignedAliceBobUrl = buildQuery('GET', '/api/alice-bob-sign', ['amount', 'userId', 'walletAddress']);

export const AliceBob = () => {
  const { analyticsState } = useAnalyticsState();
  const { publicKeyHash: walletAddress } = useAccount();

  const [amount, setAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const onAmountChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setAmount(Number(e.target.value));
    },
    [setAmount]
  );

  const submitExchangeHandler = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await getSignedAliceBobUrl({
        amount: amount.toString(),
        userId: analyticsState.userId,
        walletAddress
      });

      setIsLoading(false);
      window.open(response.url, '_blank');
    } catch {}
  }, [amount, analyticsState.userId, walletAddress]);

  const isMinAmountError = useMemo(() => amount !== 0 && amount < MIN_UAH_EXCHANGE_AMOUNT, [amount]);
  const isMaxAmountError = useMemo(() => amount !== 0 && amount > MAX_UAH_EXCHANGE_AMOUNT, [amount]);
  const disabledProceed = useMemo(
    () => isMinAmountError || isMaxAmountError || amount === 0,
    [isMinAmountError, isMaxAmountError, amount]
  );

  return (
    <PageLayout
      pageTitle={
        <div className="font-medium text-sm">
          <T id="buyWithCard" />
        </div>
      }
    >
      <div className="mx-auto my-10 text-center font-inter font-normal text-gray-700" style={{ maxWidth: 360 }}>
        <h3 className="mb-6" style={{ fontSize: 17 }}>
          <T id="enterAmount" />
        </h3>
        <TopUpInput
          type="fiat"
          currency="UAH"
          minAmount={`${MIN_UAH_EXCHANGE_AMOUNT}.00`}
          maxAmount={`${MAX_UAH_EXCHANGE_AMOUNT}.00`}
          isMinAmountError={isMinAmountError}
          isMaxAmountError={isMaxAmountError}
          onChangeInputHandler={onAmountChange}
        />
        <FormSubmitButton
          className="w-full justify-center border-none mt-6"
          style={{ background: '#4299e1' }}
          disabled={disabledProceed}
          loading={isLoading}
          testID={SelectCryptoSelectors.AliceBob}
          onClick={submitExchangeHandler}
        >
          <T id="next" />
        </FormSubmitButton>
        <div className="border-solid border-gray-300" style={{ borderTopWidth: 1 }}>
          <p className="mt-6">
            <T
              id="privacyAndPolicyLinks"
              substitutions={[
                <T id={'next'} />,
                <a
                  className={styles['link']}
                  rel="noreferrer"
                  href="https://oval-rhodium-33f.notion.site/End-User-License-Agreement-Abex-Eng-6124123e256d456a83cffc3b2977c4dc"
                  target="_blank"
                >
                  <T id={'termsOfUse'} />
                </a>,
                <a
                  className={styles['link']}
                  rel="noreferrer"
                  href="https://oval-rhodium-33f.notion.site/Privacy-Policy-Abex-Eng-d70fa7cc134341a3ac4fd04816358b9e"
                  target="_blank"
                >
                  <T id={'privacyPolicy'} />
                </a>
              ]}
            />
          </p>
          <p className="mt-6">
            <T id={'warningTopUpServiceMessage'} />
          </p>
        </div>
      </div>
    </PageLayout>
  );
};

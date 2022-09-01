import React, { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { T } from '../../../../../lib/i18n/react';
import Divider from '../../../../atoms/Divider';
import FormSubmitButton from '../../../../atoms/FormSubmitButton';
import PageLayout from '../../../../layouts/PageLayout';
import { outputTokensList } from '../../Crypto/Exolix/config';
import { SelectCryptoSelectors } from '../SelectCrypto.selectors';
import { TopUpInput } from './components/TopUpInput/TopUpInput';

const REQUEST_LATENCY = 200;

export const Utorg = () => {
  const [coinFrom, setCoinFrom] = useState(INITIAL_COIN_FROM);
  const [coinTo, setCoinTo] = useState(outputTokensList[0]);

  const [minExchangeAmount, setMinExchangeAmount] = useState(600);
  const [maxExchangeAmount, setMaxExchangeAmount] = useState(29500);

  const [amount, setAmount] = useState(0);
  const [link, setLink] = useState('');
  const [isLinkLoading, setIsLinkLoading] = useState(false);

  const isMinAmountError = useMemo(() => amount !== 0 && amount < minExchangeAmount, [amount, minExchangeAmount]);
  const isMaxAmountError = useMemo(() => amount !== 0 && amount > maxExchangeAmount, [amount, maxExchangeAmount]);
  const disabledProceed = useMemo(
    () => isMinAmountError || isMaxAmountError || amount === 0,
    [isMinAmountError, isMaxAmountError, amount]
  );

  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAmount(Number(e.target.value));
  };

  return (
    <PageLayout
      pageTitle={
        <div className="font-medium text-sm">
          <T id="buyWithCard" />
        </div>
      }
    >
      <div className="mx-auto my-10 text-center font-inter font-normal text-gray-700" style={{ maxWidth: 360 }}>
        <Divider style={{ marginBottom: '10px' }} />

        <TopUpInput
          currency={coinFrom}
          currenciesList={currencies ?? []}
          label={<T id="send" />}
          setCurrency={setCoinFrom}
          onAmountChange={handleAmountChange}
          isSearchable
        />

        <br />
        <TopUpInput
          currency={coinTo}
          currenciesList={outputTokensList}
          label={<T id="get" />}
          readOnly={true}
          amountInputDisabled={true}
          minAmount={minAmount}
          maxAmount={lastMaxAmount}
          isMinAmountError={isMinAmountError}
          isMaxAmountError={isMaxAmountError}
          amount={depositAmount}
          setCurrency={setCoinTo}
        />
        <Divider style={{ marginTop: '40px', marginBottom: '20px' }} />
        <FormSubmitButton
          className="w-full justify-center border-none mt-6"
          style={{
            background: '#4299e1',
            padding: 0
          }}
          disabled={disabledProceed}
          loading={isLinkLoading}
          testID={SelectCryptoSelectors.AliceBob}
        >
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-auto"
            style={{
              paddingTop: '0.625rem',
              paddingBottom: '0.625rem'
            }}
          >
            <T id={isMinMaxLoading ? 'updatingMinMax' : 'next'} />
          </a>
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

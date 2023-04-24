import React, { FC, Suspense, useEffect } from 'react';

import { useDispatch } from 'react-redux';

import { FormSubmitButton } from 'app/atoms';
import ErrorBoundary from 'app/ErrorBoundary';
import { ReactComponent as ArrowDownIcon } from 'app/icons/arrow-down.svg';
import PageLayout from 'app/layouts/PageLayout';
import { loadAllCurrenciesActions } from 'app/store/buy-with-credit-card/actions';
import { PaymentProviderInput } from 'app/templates/PaymentProviderInput';
import { SpinnerSection } from 'app/templates/SendForm/SpinnerSection';
import { TopUpInput } from 'app/templates/TopUpInput';
import { TopUpInputType } from 'lib/buy-with-credit-card/top-up-input-type.enum';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import { PaymentProviderInterface } from 'lib/buy-with-credit-card/topup.interface';
import { T, t } from 'lib/i18n';

import { useAllCryptoCurrencies } from './hooks/use-all-crypto-currencies';
import { useAllFiatCurrencies } from './hooks/use-all-fiat-currencies';

const DEFAULT_INPUT_CURRENCY = {
  code: 'USD',
  icon: 'https://static.moonpay.com/widget/currencies/usd.svg',
  name: 'US Dollar',
  network: {
    code: '',
    fullName: '',
    shortName: ''
  },
  precision: 2,
  type: TopUpInputType.Fiat
};
const DEFAULT_OUTPUT_TOKEN = {
  code: 'XTZ',
  name: 'Tezos',
  icon: 'https://exolix.com/icons/coins/XTZ.png',
  network: {
    code: 'XTZ',
    fullName: 'Tezos Mainnet',
    shortName: 'Tezos'
  },
  slug: 'tez',
  type: TopUpInputType.Crypto
};

const mockOptions: PaymentProviderInterface[] = [
  {
    name: 'MoonPay',
    id: TopUpProviderId.MoonPay,
    kycRequired: true,
    isBestPrice: true,
    minInputAmount: 32,
    maxInputAmount: 10000,
    inputAmount: 200,
    inputDecimals: 2,
    inputSymbol: 'USD',
    outputAmount: 198,
    outputSymbol: 'TEZ'
  },
  {
    name: 'Utorg',
    id: TopUpProviderId.Utorg,
    kycRequired: true,
    isBestPrice: false,
    minInputAmount: 33.3,
    maxInputAmount: 9999.6,
    inputAmount: 200,
    inputDecimals: 2,
    inputSymbol: 'USD',
    outputAmount: 197.7,
    outputSymbol: 'TEZ'
  },
  {
    name: 'Alice&Bob',
    id: TopUpProviderId.AliceBob,
    kycRequired: false,
    isBestPrice: false
  }
];

export const BuyWithCreditCard: FC = () => {
  const dispatch = useDispatch();
  // const [isLoading, setIsLoading] = useState(false);
  const allFiatCurrencies = useAllFiatCurrencies();
  const allCryptoCurrencies = useAllCryptoCurrencies();

  useEffect(() => void dispatch(loadAllCurrenciesActions.submit()), []);

  return (
    <PageLayout pageTitle={t('buyWithCard')}>
      <div className="max-w-sm mx-auto">
        <ErrorBoundary>
          <Suspense fallback={<SpinnerSection />}>
            <div className="flex flex-col items-center gap-4 w-full">
              <TopUpInput
                isSearchable
                label={<T id="send" />}
                amount={undefined}
                currency={DEFAULT_INPUT_CURRENCY}
                currenciesList={allFiatCurrencies}
                minAmount={String(0)}
                maxAmount={String(1000 || '---')}
                isMinAmountError={false}
                isMaxAmountError={false}
                onCurrencySelect={console.log}
                onAmountChange={console.log}
                amountInputDisabled={false}
                fitIcons={true}
              />

              <ArrowDownIcon stroke="#4299E1" className="w-6 h-6" />

              <TopUpInput
                readOnly
                amountInputDisabled
                label={<T id="get" />}
                currency={DEFAULT_OUTPUT_TOKEN}
                currenciesList={allCryptoCurrencies}
                amount={undefined}
              />

              <PaymentProviderInput options={mockOptions} isLoading={false} onChange={console.log} />

              <div className="w-full flex flex-col mt-2 gap-6 items-center">
                <FormSubmitButton
                  className="w-full justify-center border-none"
                  style={{
                    background: '#4299e1',
                    padding: 0
                  }}
                  disabled={false}
                  loading={false}
                >
                  <T id="topUp" />
                </FormSubmitButton>

                <div className="flex justify-between w-full">
                  <span className="text-xs text-gray-30 leading-relaxed">
                    <T id="exchangeRate" />:
                  </span>
                  <span className="text-xs text-gray-600 leading-relaxed">-</span>
                </div>

                <span className="text-center text-xs text-gray-700 leading-relaxed">
                  <T id="topUpDescription" />
                </span>
              </div>
            </div>
          </Suspense>
        </ErrorBoundary>
      </div>
    </PageLayout>
  );
};

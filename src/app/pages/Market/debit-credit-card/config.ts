import { MOONPAY_ASSETS_BASE_URL } from 'lib/apis/moonpay';
import { t } from 'lib/i18n';

import { ModalHeaderConfig } from '../types';

import { TopUpProviderId } from './top-up-provider-id.enum';
import { PaymentProviderInterface, TopUpInputInterface, TopUpOutputInterface } from './topup.interface';

export const VALUE_PLACEHOLDER = '---';

export const DEFAULT_INPUT_CURRENCY: TopUpInputInterface = {
  code: 'USD',
  icon: `${MOONPAY_ASSETS_BASE_URL}/widget/currencies/usd.svg`,
  name: 'US Dollar',
  precision: 2
};

export const DEFAULT_TEZOS_OUTPUT_TOKEN: TopUpOutputInterface = {
  code: 'XTZ',
  name: 'Tezos',
  icon: `${MOONPAY_ASSETS_BASE_URL}/widget/currencies/xtz.svg`,
  precision: 1,
  slug: 'tez'
};

export const DEFAULT_EVM_OUTPUT_TOKEN: TopUpOutputInterface = {
  code: 'ETH',
  name: 'Ethereum',
  icon: `${MOONPAY_ASSETS_BASE_URL}/widget/currencies/eth.svg`,
  precision: 1,
  slug: 'eth'
};

export const DEFAULT_PROVIDER: PaymentProviderInterface = {
  name: 'MoonPay',
  id: TopUpProviderId.MoonPay,
  kycRequired: false,
  isBestPrice: false
};

export interface FormData {
  inputValue: string;
  inputCurrency: TopUpInputInterface;
  outputToken: TopUpOutputInterface;
  provider: PaymentProviderInterface;
}

export const defaultModalHeaderConfig: ModalHeaderConfig = {
  title: t('debitCreditCard'),
  titleLeft: undefined
};

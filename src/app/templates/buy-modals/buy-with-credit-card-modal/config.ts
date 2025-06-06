import { ModalHeaderConfig } from 'app/atoms/PageModal';
import { MOONPAY_ASSETS_BASE_URL } from 'lib/apis/moonpay';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import { toTopUpTokenSlug } from 'lib/buy-with-credit-card/top-up-token-slug.utils';
import { TopUpInputInterface, TopUpOutputInterface } from 'lib/buy-with-credit-card/topup.interface';
import { t } from 'lib/i18n';
import { ETHEREUM_MAINNET_CHAIN_ID, TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { TempleChainKind } from 'temple/types';

export const FORM_REFRESH_INTERVAL = 30000;

export const VALUE_PLACEHOLDER = '---';

const allProviders = [TopUpProviderId.MoonPay, TopUpProviderId.Utorg];

export const DEFAULT_INPUT_CURRENCY: TopUpInputInterface = {
  code: 'USD',
  icon: `${MOONPAY_ASSETS_BASE_URL}/widget/currencies/usd.svg`,
  providers: allProviders,
  name: 'US Dollar',
  precision: 2
};

export const DEFAULT_TEZOS_OUTPUT_TOKEN: TopUpOutputInterface = {
  code: 'XTZ',
  name: 'Tezos',
  icon: `${MOONPAY_ASSETS_BASE_URL}/widget/currencies/xtz.svg`,
  providers: allProviders,
  precision: 1,
  slug: toTopUpTokenSlug('XTZ', TempleChainKind.Tezos, TEZOS_MAINNET_CHAIN_ID)
};

export const DEFAULT_EVM_OUTPUT_TOKEN: TopUpOutputInterface = {
  code: 'ETH',
  name: 'Ethereum',
  icon: `${MOONPAY_ASSETS_BASE_URL}/widget/currencies/eth.svg`,
  providers: [TopUpProviderId.MoonPay, TopUpProviderId.Utorg],
  precision: 1,
  slug: toTopUpTokenSlug('ETH', TempleChainKind.EVM, ETHEREUM_MAINNET_CHAIN_ID.toString())
};

export const defaultModalHeaderConfig: ModalHeaderConfig = {
  title: t('debitCreditCard'),
  onGoBack: undefined
};

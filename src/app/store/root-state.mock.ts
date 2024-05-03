import { mockNotificationsState } from 'lib/notifications';

import { mockABTestingState } from './ab-testing/state.mock';
import { mockAdvertisingState } from './advertising/state.mock';
import { mockBuyWithCreditCardState } from './buy-with-credit-card/state.mock';
import { mockDAppsState } from './d-apps/state.mock';
import { mockEvmAssetsState } from './evm/assets/state.mock';
import { mockEvmBalancesState } from './evm/balances/state.mock';
import { mockEvmCollectiblesMetadataState } from './evm/collectibles-metadata/state.mock';
import { mockEvmState } from './evm/state.mock';
import { mockEvmTokensExchangeRatesState } from './evm/tokens-exchange-rates/state.mock';
import { mockEvmTokensMetadataState } from './evm/tokens-metadata/state.mock';
import { mockNewsletterState } from './newsletter/newsletter-state.mock';
import { mockPartnersPromotionState } from './partners-promotion/state.mock';
import type { RootState } from './root-state.type';
import { mockSettingsState } from './settings/state.mock';
import { mockSwapState } from './swap/state.mock';
import { mockAssetsState } from './tezos/assets/state.mock';
import { mockBalancesState } from './tezos/balances/state.mock';
import { mockCollectiblesState } from './tezos/collectibles/state.mock';
import { mockCollectiblesMetadataState } from './tezos/collectibles-metadata/state.mock';
import { mockCurrencyState } from './tezos/currency/state.mock';
import { mockTokensMetadataState } from './tezos/tokens-metadata/state.mock';

// ts-prune-ignore-next
export const mockRootState: RootState = {
  settings: mockSettingsState,
  advertising: mockAdvertisingState,
  currency: mockCurrencyState,
  notifications: mockNotificationsState,
  dApps: mockDAppsState,
  swap: mockSwapState,
  partnersPromotion: mockPartnersPromotionState,
  balances: mockBalancesState,
  assets: mockAssetsState,
  tokensMetadata: mockTokensMetadataState,
  collectiblesMetadata: mockCollectiblesMetadataState,
  abTesting: mockABTestingState,
  buyWithCreditCard: mockBuyWithCreditCardState,
  collectibles: mockCollectiblesState,
  newsletter: mockNewsletterState,
  evm: mockEvmState,
  evmAssets: mockEvmAssetsState,
  evmBalances: mockEvmBalancesState,
  evmTokensMetadata: mockEvmTokensMetadataState,
  evmCollectiblesMetadata: mockEvmCollectiblesMetadataState,
  evmTokensExchangeRates: mockEvmTokensExchangeRatesState
};

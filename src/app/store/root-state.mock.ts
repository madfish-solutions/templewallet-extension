import { mockNotificationsState } from 'lib/notifications';

import { mockABTestingState } from './ab-testing/state.mock';
import { mockAdvertisingState } from './advertising/state.mock';
import { mockBuyWithCreditCardState } from './buy-with-credit-card/state.mock';
import { mockDAppsState } from './d-apps/state.mock';
import { mockEVMAssetsState } from './evm/assets/state.mock';
import { mockEVMBalancesState } from './evm/balances/state.mock';
import { mockEVMCurrencyState } from './evm/currency/state.mock';
import { mockEVMTokensMetadataState } from './evm/tokens-metadata/state.mock';
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
  evmBalances: mockEVMBalancesState,
  evmAssets: mockEVMAssetsState,
  evmTokensMetadata: mockEVMTokensMetadataState,
  evmCurrency: mockEVMCurrencyState
};

import { mockNotificationsState } from 'lib/notifications';

import { mockABTestingState } from './ab-testing/state.mock';
import { mockAdvertisingState } from './advertising/state.mock';
import { mockBalancesState } from './balances/state.mock';
import { mockBuyWithCreditCardState } from './buy-with-credit-card/state.mock';
import { mockCurrencyState } from './currency/state.mock';
import { mockDAppsState } from './d-apps/state.mock';
import { mockNewsletterState } from './newsletter/newsletter-state.mock';
import { mockPartnersPromotionState } from './partners-promotion/state.mock';
import type { RootState } from './root-state.type';
import { mockSettingsState } from './settings/state.mock';
import { mockSwapState } from './swap/state.mock';
import { mockTokensMetadataState } from './tokens-metadata/state.mock';

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
  tokensMetadata: mockTokensMetadataState,
  abTesting: mockABTestingState,
  buyWithCreditCard: mockBuyWithCreditCardState,
  newsletter: mockNewsletterState
};

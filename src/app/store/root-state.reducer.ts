import { combineReducers } from '@reduxjs/toolkit';

import { notificationsReducer } from 'lib/notifications';

import { abTestingReducer } from './ab-testing/reducers';
import { advertisingReducer } from './advertising/reducers';
import { buyWithCreditCardReducer } from './buy-with-credit-card/reducers';
import { dAppsReducer } from './d-apps/reducers';
import { evmAssetsReducer } from './evm/assets/reducer';
import { evmBalancesReducer } from './evm/balances/reducers';
import { evmCollectiblesMetadataReducer } from './evm/collectibles-metadata/reducers';
import { evmLoadingReducer } from './evm/reducer';
import { evmTokensExchangeRatesReducer } from './evm/tokens-exchange-rates/reducers';
import { evmTokensMetadataReducer } from './evm/tokens-metadata/reducers';
import { newsletterReducers } from './newsletter/newsletter-reducers';
import { partnersPromotionPersistedReducer } from './partners-promotion/reducers';
import { settingsPersistedReducer } from './settings/reducers';
import { swapReducer } from './swap/reducers';
import { assetsPersistedReducer } from './tezos/assets/reducer';
import { balancesReducer } from './tezos/balances/reducers';
import { collectiblesPersistedReducer } from './tezos/collectibles/reducer';
import { collectiblesMetadataPersistedReducer } from './tezos/collectibles-metadata/reducer';
import { currencyReducer } from './tezos/currency/reducers';
import { tokensMetadataReducer } from './tezos/tokens-metadata/reducers';

const rootStateReducersMap = {
  settings: settingsPersistedReducer,
  advertising: advertisingReducer,
  currency: currencyReducer,
  notifications: notificationsReducer,
  dApps: dAppsReducer,
  swap: swapReducer,
  partnersPromotion: partnersPromotionPersistedReducer,
  balances: balancesReducer,
  assets: assetsPersistedReducer,
  tokensMetadata: tokensMetadataReducer,
  collectiblesMetadata: collectiblesMetadataPersistedReducer,
  abTesting: abTestingReducer,
  buyWithCreditCard: buyWithCreditCardReducer,
  collectibles: collectiblesPersistedReducer,
  newsletter: newsletterReducers,
  evmLoading: evmLoadingReducer,
  evmAssets: evmAssetsReducer,
  evmBalances: evmBalancesReducer,
  evmTokensMetadata: evmTokensMetadataReducer,
  evmTokensExchangeRates: evmTokensExchangeRatesReducer,
  evmCollectiblesMetadata: evmCollectiblesMetadataReducer
};

export const rootReducer = combineReducers(rootStateReducersMap);

import { combineReducers } from '@reduxjs/toolkit';

import { notificationsReducer } from 'lib/notifications';

import { abTestingReducer } from './ab-testing/reducers';
import { advertisingReducer } from './advertising/reducers';
import { assetsFilterOptionsReducer } from './assets-filter-options/reducer';
import { buyWithCreditCardReducer } from './buy-with-credit-card/reducers';
import { currencyPersistedReducer } from './currency/reducers';
import { dAppsReducer } from './d-apps/reducers';
import { evmAssetsPersistedReducer } from './evm/assets/reducer';
import { evmBalancesReducer } from './evm/balances/reducers';
import { evmCollectiblesMetadataPersistedReducer } from './evm/collectibles-metadata/reducers';
import { evmLoadingReducer } from './evm/reducer';
import { evmTokensExchangeRatesPersistedReducer } from './evm/tokens-exchange-rates/reducers';
import { evmTokensMetadataPersistedReducer } from './evm/tokens-metadata/reducers';
import { newsletterReducers } from './newsletter/newsletter-reducers';
import { partnersPromotionPersistedReducer } from './partners-promotion/reducers';
import { settingsPersistedReducer } from './settings/reducers';
import { swapReducer } from './swap/reducers';
import { assetsPersistedReducer } from './tezos/assets/reducer';
import { balancesReducer } from './tezos/balances/reducers';
import { collectiblesPersistedReducer } from './tezos/collectibles/reducer';
import { collectiblesMetadataPersistedReducer } from './tezos/collectibles-metadata/reducer';
import { tokensMetadataReducer } from './tezos/tokens-metadata/reducers';

const rootStateReducersMap = {
  settings: settingsPersistedReducer,
  advertising: advertisingReducer,
  currency: currencyPersistedReducer,
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
  evmAssets: evmAssetsPersistedReducer,
  evmBalances: evmBalancesReducer,
  evmTokensMetadata: evmTokensMetadataPersistedReducer,
  evmTokensExchangeRates: evmTokensExchangeRatesPersistedReducer,
  evmCollectiblesMetadata: evmCollectiblesMetadataPersistedReducer,
  assetsFilterOptions: assetsFilterOptionsReducer
};

export const rootReducer = combineReducers(rootStateReducersMap);

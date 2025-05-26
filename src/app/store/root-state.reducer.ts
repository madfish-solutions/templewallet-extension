import { combineReducers } from '@reduxjs/toolkit';

import { abTestingReducer } from './ab-testing/reducers';
import { accountsInitializationReducer } from './accounts-initialization/reducers';
import { advertisingReducer } from './advertising/reducers';
import { assetsFilterOptionsReducer } from './assets-filter-options/reducer';
import { buyWithCreditCardReducer } from './buy-with-credit-card/reducers';
import { cryptoExchangePersistedReducer } from './crypto-exchange/reducers';
import { currencyPersistedReducer } from './currency/reducers';
import { dAppsReducer } from './d-apps/reducers';
import { evmAssetsPersistedReducer } from './evm/assets/reducer';
import { evmBalancesReducer } from './evm/balances/reducers';
import { evmCollectiblesMetadataPersistedReducer } from './evm/collectibles-metadata/reducers';
import { noCategoryEvmAssetsMetadataPersistedReducer } from './evm/no-category-assets-metadata/reducers';
import { evmLoadingReducer } from './evm/reducer';
import { evmTokensExchangeRatesPersistedReducer } from './evm/tokens-exchange-rates/reducers';
import { evmTokensMetadataPersistedReducer } from './evm/tokens-metadata/reducers';
import { newsletterReducers } from './newsletter/newsletter-reducers';
import { notificationsReducer } from './notifications/reducers';
import { partnersPromotionPersistedReducer } from './partners-promotion/reducers';
import { rewardsReducer } from './rewards/reducers';
import { settingsPersistedReducer } from './settings/reducers';
import { swapPersistedReducer } from './swap/reducers';
import { assetsPersistedReducer } from './tezos/assets/reducer';
import { balancesReducer } from './tezos/balances/reducers';
import { collectiblesPersistedReducer } from './tezos/collectibles/reducer';
import { collectiblesMetadataPersistedReducer } from './tezos/collectibles-metadata/reducer';
import { noCategoryTezosAssetsMetadataPersistedReducer } from './tezos/no-category-assets-metadata/reducers';
import { tokensMetadataReducer } from './tezos/tokens-metadata/reducers';

const rootStateReducersMap = {
  settings: settingsPersistedReducer,
  advertising: advertisingReducer,
  currency: currencyPersistedReducer,
  notifications: notificationsReducer,
  dApps: dAppsReducer,
  swap: swapPersistedReducer,
  partnersPromotion: partnersPromotionPersistedReducer,
  balances: balancesReducer,
  assets: assetsPersistedReducer,
  tokensMetadata: tokensMetadataReducer,
  collectiblesMetadata: collectiblesMetadataPersistedReducer,
  noCategoryAssetMetadata: noCategoryTezosAssetsMetadataPersistedReducer,
  abTesting: abTestingReducer,
  cryptoExchange: cryptoExchangePersistedReducer,
  buyWithCreditCard: buyWithCreditCardReducer,
  collectibles: collectiblesPersistedReducer,
  newsletter: newsletterReducers,
  rewards: rewardsReducer,
  evmLoading: evmLoadingReducer,
  evmAssets: evmAssetsPersistedReducer,
  evmBalances: evmBalancesReducer,
  evmTokensMetadata: evmTokensMetadataPersistedReducer,
  evmTokensExchangeRates: evmTokensExchangeRatesPersistedReducer,
  evmCollectiblesMetadata: evmCollectiblesMetadataPersistedReducer,
  evmNoCategoryAssetMetadata: noCategoryEvmAssetsMetadataPersistedReducer,
  assetsFilterOptions: assetsFilterOptionsReducer,
  accountsInitialization: accountsInitializationReducer
};

export const rootReducer = combineReducers(rootStateReducersMap);

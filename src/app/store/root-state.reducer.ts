import { combineReducers } from '@reduxjs/toolkit';

import { lifiEvmTokensMetadataPersistedReducer } from 'app/store/evm/swap-lifi-metadata/reducers';

import { abTestingReducer } from './ab-testing/reducers';
import { accountsInitializationReducer } from './accounts-initialization/reducers';
import { assetsFilterOptionsReducer } from './assets-filter-options/reducer';
import { buyWithCreditCardReducer } from './buy-with-credit-card/reducers';
import { cryptoExchangePersistedReducer } from './crypto-exchange/reducers';
import { currencyPersistedReducer } from './currency/reducers';
import { dAppsReducer } from './d-apps/reducers';
import { evmAssetsPersistedReducer } from './evm/assets/reducer';
import { evmBalancesReducer } from './evm/balances/reducers';
import { evmCollectiblesMetadataPersistedReducer } from './evm/collectibles-metadata/reducers';
import { noCategoryEvmAssetsMetadataPersistedReducer } from './evm/no-category-assets-metadata/reducers';
import { pendingEvmTransactionsPersistedReducer } from './evm/pending-transactions/reducers';
import { evmLoadingReducer } from './evm/reducer';
import { stakeWithdrawalReadyNotificationsReducer } from './evm/stake-withdrawal-ready-notifications/reducers';
import { evmTokensExchangeRatesPersistedReducer } from './evm/tokens-exchange-rates/reducers';
import { evmTokensMetadataPersistedReducer } from './evm/tokens-metadata/reducers';
import { newsletterReducers } from './newsletter/newsletter-reducers';
import { notificationsReducer } from './notifications/reducers';
import { partnersPromotionPersistedReducer } from './partners-promotion/reducers';
import { rewardsReducer } from './rewards/reducers';
import { settingsReducer } from './settings/reducers';
import { swapPersistedReducer } from './swap/reducers';
import { assetsPersistedReducer } from './tezos/assets/reducer';
import { balancesReducer } from './tezos/balances/reducers';
import { collectiblesPersistedReducer } from './tezos/collectibles/reducer';
import { collectiblesMetadataPersistedReducer } from './tezos/collectibles-metadata/reducer';
import { noCategoryTezosAssetsMetadataPersistedReducer } from './tezos/no-category-assets-metadata/reducers';
import { tokensMetadataReducer } from './tezos/tokens-metadata/reducers';

const rootStateReducersMap = {
  settings: settingsReducer,
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
  pendingEvmTransactions: pendingEvmTransactionsPersistedReducer,
  lifiEvmTokensMetadata: lifiEvmTokensMetadataPersistedReducer,
  evmTokensMetadata: evmTokensMetadataPersistedReducer,
  evmTokensExchangeRates: evmTokensExchangeRatesPersistedReducer,
  evmCollectiblesMetadata: evmCollectiblesMetadataPersistedReducer,
  evmNoCategoryAssetMetadata: noCategoryEvmAssetsMetadataPersistedReducer,
  evmStakeWithdrawalReadyNotifications: stakeWithdrawalReadyNotificationsReducer,
  assetsFilterOptions: assetsFilterOptionsReducer,
  accountsInitialization: accountsInitializationReducer
};

export const rootReducer = combineReducers(rootStateReducersMap);

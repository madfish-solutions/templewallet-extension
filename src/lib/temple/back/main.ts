import { AES } from 'crypto-js';
import { pick } from 'lodash';
import memoizee from 'memoizee';
import browser, { Runtime } from 'webextension-polyfill';
import { ValidationError } from 'yup';

import { getStoredAppInstallIdentity } from 'app/storage/app-install-id';
import type { DealsState } from 'app/store/deals/state';
import { importUpdateRulesStorageModule } from 'lib/ads/import-update-rules-storage';
import { importAdsApiModule } from 'lib/apis/ads-api';
import {
  ADS_VIEWER_DATA_STORAGE_KEY,
  ANALYTICS_USER_ID_STORAGE_KEY,
  ContentScriptType,
  DEALS_ANNOUNCEMENT_SHOWN_STORAGE_KEY,
  REWARDS_ACCOUNT_DATA_STORAGE_KEY,
  USAGE_ANALYTICS_ENABLED,
  WEB_WIDGETS_LOCAL_AD_PERMIT,
  WEB_WIDGETS_SNOOZE_DURATION_MS,
  WEB_WIDGETS_SNOOZE_UNTIL,
  WEB_WIDGETS_TOKEN_INSIGHT_ENABLED,
  WEBSITES_ADS_ENABLED
} from 'lib/constants';
import { E2eMessageType } from 'lib/e2e/types';
import { BACKGROUND_IS_WORKER, EnvVars, IS_FIREFOX, IS_MISES_BROWSER } from 'lib/env';
import { fetchFromStorage, putToStorage } from 'lib/storage';
import { AnalyticsEventCategory } from 'lib/temple/analytics-types';
import {
  importCoinsBySymbolModule,
  importFetchObjktTokenModule,
  importFetchThumbnailModule,
  importFetchTokenChartModule,
  importResolveTcoModule
} from 'lib/temple/back/import-web-widgets-handlers';
import { encodeMessage, encryptMessage, getSenderId, MessageType, Response } from 'lib/temple/beacon';
import { clearAsyncStorages } from 'lib/temple/reset';
import { StoredHDAccount, TempleMessageType, TempleRequest, TempleResponse } from 'lib/temple/types';
import { withNonImportErrorForwarding } from 'lib/utils/import-error';
import { getTrackedCashbackServiceDomain, getTrackedUrl } from 'lib/utils/url-track/url-track.utils';
import { EVMErrorCodes } from 'temple/evm/constants';
import { ErrorWithCode } from 'temple/evm/types';
import { parseTransactionRequest } from 'temple/evm/utils';
import { AdsViewerData, RewardsAddresses, TempleChainKind } from 'temple/types';

import * as Actions from './actions';
import * as Analytics from './analytics';
import { intercom } from './defaults';
import { markConfirmationWindowDetached } from './request-confirm';
import { store, toFront } from './store';

const frontStore = store.map(toFront);

const DEALS_STORAGE_KEY = 'persist:root.deals';
const MERCHANT_OFFER_SUPPRESSION_TTL = 15 * 60 * 1000;
const merchantOfferSuppressedAt = new Map<string, number>();

export const start = async () => {
  intercom.onRequest(processRequestWithErrorsLogged);
  await Actions.init();

  if (BACKGROUND_IS_WORKER) await Actions.unlockFromSession().catch(e => console.error(e));

  frontStore.watch(() => {
    intercom.broadcast({ type: TempleMessageType.StateUpdated });
  });
};

const processRequestWithErrorsLogged = (...args: Parameters<typeof processRequest>) =>
  processRequest(...args).catch(error => {
    console.error(error);
    throw error;
  });

const processRequest = async (req: TempleRequest, port: Runtime.Port): Promise<TempleResponse | void> => {
  switch (req.type) {
    case TempleMessageType.SendTrackEventRequest:
      await Analytics.trackEvent(req);
      return { type: TempleMessageType.SendTrackEventResponse };

    case TempleMessageType.SendPageEventRequest:
      await Analytics.pageEvent(req);
      return { type: TempleMessageType.SendPageEventResponse };

    case TempleMessageType.GetStateRequest:
      const state = await Actions.getFrontState();
      return {
        type: TempleMessageType.GetStateResponse,
        state
      };

    case TempleMessageType.SendEvmTransactionRequest:
      const txHash = await Actions.sendEvmTransaction(
        req.accountPkh,
        req.network,
        parseTransactionRequest(req.txParams)
      );
      return { type: TempleMessageType.SendEvmTransactionResponse, txHash };

    case TempleMessageType.NewWalletRequest:
      const accountPkh = await Actions.registerNewWallet(req.password, req.mnemonic);
      return { type: TempleMessageType.NewWalletResponse, accountPkh };

    case TempleMessageType.UnlockRequest:
      await Actions.unlock(req.password);
      return { type: TempleMessageType.UnlockResponse };

    case TempleMessageType.LockRequest:
      await Actions.lock();
      return { type: TempleMessageType.LockResponse };

    case TempleMessageType.FindFreeHDAccountIndexRequest:
      const responsePayload = await Actions.findFreeHDAccountIndex(req.walletId);
      return {
        type: TempleMessageType.FindFreeHDAccountIndexResponse,
        ...responsePayload
      };

    case TempleMessageType.CreateAccountRequest:
      await Actions.createHDAccount(req.walletId, req.name, req.hdIndex);
      return { type: TempleMessageType.CreateAccountResponse };

    case TempleMessageType.RevealPublicKeyRequest:
      const publicKey = await Actions.revealPublicKey(req.accountAddress);
      return {
        type: TempleMessageType.RevealPublicKeyResponse,
        publicKey
      };

    case TempleMessageType.RevealPrivateKeyRequest:
      const privateKey = await Actions.revealPrivateKey(req.address, req.password);
      return {
        type: TempleMessageType.RevealPrivateKeyResponse,
        privateKey
      };

    case TempleMessageType.RevealMnemonicRequest:
      const mnemonic = await Actions.revealMnemonic(req.walletId, req.password);
      return {
        type: TempleMessageType.RevealMnemonicResponse,
        mnemonic
      };

    case TempleMessageType.GenerateSyncPayloadRequest:
      const payload = await Actions.generateSyncPayload(req.password, req.walletId);
      return {
        type: TempleMessageType.GenerateSyncPayloadResponse,
        payload
      };

    case TempleMessageType.RemoveAccountRequest:
      await Actions.removeAccount(req.id, req.password);
      return {
        type: TempleMessageType.RemoveAccountResponse
      };

    case TempleMessageType.EditAccountRequest:
      await Actions.editAccount(req.id, req.name);
      return {
        type: TempleMessageType.EditAccountResponse
      };

    case TempleMessageType.SetAccountHiddenRequest:
      await Actions.setAccountHidden(req.id, req.value);
      return {
        type: TempleMessageType.SetAccountHiddenResponse
      };

    case TempleMessageType.ImportAccountRequest:
      await Actions.importAccount(req.chain, req.privateKey, req.encPassword);
      return {
        type: TempleMessageType.ImportAccountResponse
      };

    case TempleMessageType.ImportMnemonicAccountRequest:
      await Actions.importMnemonicAccount(req.mnemonic, req.password, req.derivationPath);
      return {
        type: TempleMessageType.ImportMnemonicAccountResponse
      };

    case TempleMessageType.ImportWatchOnlyAccountRequest:
      await Actions.importWatchOnlyAccount(req.chain, req.address, req.chainId);
      return {
        type: TempleMessageType.ImportWatchOnlyAccountResponse
      };

    case TempleMessageType.GetLedgerTezosPkRequest:
      return {
        type: TempleMessageType.GetLedgerTezosPkResponse,
        publicKey: await Actions.getLedgerTezosPk(req.derivationPath, req.derivationType)
      };

    case TempleMessageType.GetLedgerEVMPkRequest:
      return {
        type: TempleMessageType.GetLedgerEVMPkResponse,
        publicKey: await Actions.getLedgerEVMPk(req.derivationPath)
      };

    case TempleMessageType.CreateLedgerAccountRequest:
      await Actions.createLedgerAccount(req.input);
      return {
        type: TempleMessageType.CreateLedgerAccountResponse
      };

    case TempleMessageType.UpdateSettingsRequest:
      await Actions.updateSettings(req.settings);
      return {
        type: TempleMessageType.UpdateSettingsResponse
      };

    case TempleMessageType.RemoveHdWalletRequest:
      await Actions.removeHdWallet(req.id, req.password);
      return {
        type: TempleMessageType.RemoveHdWalletResponse
      };

    case TempleMessageType.RemoveAccountsByTypeRequest:
      await Actions.removeAccountsByType(req.accountsType, req.password);
      return {
        type: TempleMessageType.RemoveAccountsByTypeResponse
      };

    case TempleMessageType.CreateOrImportWalletRequest:
      await Actions.createOrImportWallet(req.mnemonic);
      return {
        type: TempleMessageType.CreateOrImportWalletResponse
      };

    case TempleMessageType.OperationsRequest:
      const { opHash } = await Actions.sendOperations(
        port,
        req.id,
        req.sourcePkh,
        req.network,
        req.opParams,
        req.straightaway
      );
      return {
        type: TempleMessageType.OperationsResponse,
        opHash
      };

    case TempleMessageType.SignRequest:
      const result = await Actions.sign(port, req.id, req.sourcePkh, req.network, req.bytes, req.watermark);
      return {
        type: TempleMessageType.SignResponse,
        result
      };

    case TempleMessageType.ConfirmationWindowDetachRequest:
      markConfirmationWindowDetached(req.id);
      return { type: TempleMessageType.ConfirmationWindowDetachResponse };

    case TempleMessageType.ProvePossessionRequest:
      const proveResult = await Actions.provePossession(req.sourcePkh);
      return {
        type: TempleMessageType.ProvePossessionResponse,
        result: proveResult
      };

    case TempleMessageType.DAppRemoveSessionRequest:
      const sessions = await Actions.removeDAppSession(req.origins);
      return {
        type: TempleMessageType.DAppRemoveSessionResponse,
        sessions
      };

    case TempleMessageType.DAppSwitchEvmChainRequest:
      await Actions.switchEvmChain(req.origin, req.chainId, true);
      return { type: TempleMessageType.DAppSwitchEvmChainResponse };

    case TempleMessageType.DAppSwitchEvmAccountRequest:
      await Actions.switchEvmAccount(req.origin, req.account);
      return { type: TempleMessageType.DAppSwitchEvmAccountResponse };

    case TempleMessageType.DAppSwitchTezosAccountRequest:
      await Actions.switchTezosAccount(req.origin, req.account, req.publicKey);
      return { type: TempleMessageType.DAppSwitchTezosAccountResponse };

    case TempleMessageType.Acknowledge: {
      if (req.payload !== 'PING' && req.payload !== 'ping' && req.beacon) {
        const {
          req: res,
          recipientPubKey,
          payload
        } = await Actions.getBeaconMessage(req.origin, req.payload, req.encrypted);
        if (payload) {
          return;
        }
        if (!req) {
          return;
        }

        const response: {
          type: MessageType.Acknowledge;
          version: string;
          id: string;
          senderId: string;
        } = {
          version: '2',
          senderId: await getSenderId(),
          id: res?.id ?? '',
          type: MessageType.Acknowledge
        };

        const pubKey = res?.type === MessageType.HandshakeRequest && res.publicKey ? res.publicKey : recipientPubKey;
        if (!pubKey) {
          throw new Error('DApp public key not found.');
        }

        return {
          type: TempleMessageType.Acknowledge,
          payload: await encryptMessage(encodeMessage<Response>(response), pubKey),
          encrypted: true
        };
      }
      break;
    }

    case TempleMessageType.PageRequest:
      const dAppEnabled = await Actions.canInteractWithDApps();

      if (!dAppEnabled && req.chainType === TempleChainKind.EVM) {
        return {
          type: TempleMessageType.PageResponse,
          payload: {
            error: {
              code: EVMErrorCodes.NOT_AUTHORIZED,
              message: 'DApp interaction is disabled'
            }
          }
        };
      }

      if (!dAppEnabled) {
        return;
      }

      if (req.chainType === TempleChainKind.EVM) {
        let resPayload: any;
        try {
          resPayload = {
            data: await Actions.processEvmDApp(req.origin, req.payload, req.chainId, req.iconUrl, req.providers)
          };
        } catch (e) {
          console.error(e);
          if (e instanceof ErrorWithCode) {
            resPayload = {
              error: {
                code: e.code,
                message: e.message,
                data: e.data
              }
            };
          } else if (e instanceof ValidationError) {
            resPayload = {
              error: {
                code: EVMErrorCodes.INVALID_PARAMS,
                message: e.message
              }
            };
          } else {
            resPayload = {
              error: {
                code: EVMErrorCodes.INTERNAL_ERROR,
                message: e instanceof Error ? e.message : 'Unknown error'
              }
            };
          }
        }

        return { type: TempleMessageType.PageResponse, payload: resPayload };
      }

      if (req.payload === 'PING') {
        return {
          type: TempleMessageType.PageResponse,
          payload: 'PONG'
        };
      } else if (req.beacon && req.payload === 'ping') {
        return {
          type: TempleMessageType.PageResponse,
          payload: 'pong'
        };
      }

      if (!req.beacon) {
        const resPayload = await Actions.processDApp(req.origin, req.payload);
        return {
          type: TempleMessageType.PageResponse,
          payload: resPayload ?? null
        };
      } else {
        const res = await Actions.processBeacon(req.origin, req.payload, req.encrypted);
        return {
          type: TempleMessageType.PageResponse,
          payload: res?.payload ?? null,
          encrypted: res?.encrypted
        };
      }

    case TempleMessageType.ResetExtensionRequest:
      await Actions.resetExtension(req.password);
      return {
        type: TempleMessageType.ResetExtensionResponse
      };
  }
};

browser.runtime.onMessage.addListener(async (msg, sender) => {
  try {
    switch (msg?.type) {
      case ContentScriptType.UpdateAdsRules:
        const { updateRulesStorage } = await importUpdateRulesStorageModule();
        await updateRulesStorage();
        return;

      case E2eMessageType.ResetRequest:
        return clearAsyncStorages().then(() => ({ type: E2eMessageType.ResetResponse }));

      case ContentScriptType.ExternalLinksActivity:
        const trackedCashbackServiceDomain = getTrackedCashbackServiceDomain(msg.url);

        if (trackedCashbackServiceDomain) {
          await Analytics.client.track('External Cashback Links Activity', { domain: trackedCashbackServiceDomain });
        }

        const trackedUrl = getTrackedUrl(msg.url);

        if (trackedUrl) {
          const { tezosAddress: accountPkh } = await getAdsViewerCredentials();
          await Analytics.client.track('External links activity', { url: trackedUrl, accountPkh });
        }

        break;

      case ContentScriptType.ExternalPageLocation:
        const senderTabId = sender.tab?.id;
        const senderTabUrl = sender.tab?.url;
        if (senderTabId !== undefined && senderTabId !== browser.tabs.TAB_ID_NONE && senderTabUrl) {
          try {
            Actions.setTabOrigin(senderTabId, new URL(senderTabUrl).origin);
          } catch {
            // Ignore errors when setting tab origin, e.g. if the URL is invalid
          }
        }
        break;

      case ContentScriptType.ExternalAdsActivity: {
        await withNonImportErrorForwarding(async () => {
          const { postAdImpression, postAnonymousAdImpression } = await importAdsApiModule();
          const urlDomain = new URL(msg.url).hostname;
          const rewardsAddresses = await getRewardsAccountCredentials();

          if (rewardsAddresses.evmAddress) {
            await postAdImpression(rewardsAddresses, msg.provider, { urlDomain });
          } else {
            const identity = await getStoredAppInstallIdentity();
            if (!identity) throw new Error('App identity not found');
            const installId = identity.publicKeyHash;
            await postAnonymousAdImpression(installId, msg.provider, { urlDomain });
          }
        });
        break;
      }

      case ContentScriptType.FetchReferralsRules: {
        return await getReferralsRules();
      }

      case ContentScriptType.ResolveTco: {
        const { resolveTco } = await importResolveTcoModule();
        return await resolveTco(msg.tcoUrl);
      }

      case ContentScriptType.FetchObjktToken: {
        const { fetchObjktToken } = await importFetchObjktTokenModule();
        return await fetchObjktToken(msg.fa, msg.tokenId);
      }

      case ContentScriptType.FetchThumbnailBlob: {
        const { fetchThumbnailBlob } = await importFetchThumbnailModule();
        return await fetchThumbnailBlob(msg.url);
      }

      case ContentScriptType.GetCoinsBySymbol: {
        const { getCoinsBySymbol } = await importCoinsBySymbolModule();
        return await getCoinsBySymbol();
      }

      case ContentScriptType.FetchTokenChart: {
        const { fetchTokenChart } = await importFetchTokenChartModule();
        return await fetchTokenChart(msg.coinId);
      }

      case ContentScriptType.WidgetContext: {
        const stored = await browser.storage.local.get([
          WEB_WIDGETS_LOCAL_AD_PERMIT,
          WEB_WIDGETS_SNOOZE_UNTIL,
          WEBSITES_ADS_ENABLED,
          USAGE_ANALYTICS_ENABLED
        ]);

        let tezFiatRate: number | null = null;
        try {
          const { fetchTezExchangeRate } = await import('lib/apis/temple/endpoints/get-exchange-rates');
          tezFiatRate = await fetchTezExchangeRate();
        } catch {
          tezFiatRate = null;
        }

        const snoozeUntil = stored[WEB_WIDGETS_SNOOZE_UNTIL];
        const shouldShowPromotion = Boolean(stored[WEBSITES_ADS_ENABLED]);

        let evmAddress: string | undefined;
        if (shouldShowPromotion) {
          evmAddress = (await getRewardsAccountCredentials()).evmAddress;
        }
        const origin = sender.tab?.url ? new URL(sender.tab.url).origin : 'https://x.com';

        return {
          permitGranted: Boolean(stored[WEB_WIDGETS_LOCAL_AD_PERMIT]),
          snoozeUntil: typeof snoozeUntil === 'number' ? snoozeUntil : null,
          shouldShowPromotion,
          analyticsEnabled: Boolean(stored[USAGE_ANALYTICS_ENABLED]),
          tezFiatRate,
          adUrl: buildWidgetAdUrl(origin, evmAddress)
        };
      }

      case ContentScriptType.WidgetOwnedCount: {
        const { fetchObjktOwnedCount } = await importFetchObjktTokenModule();
        const { accounts } = await Actions.getFrontState();
        const addresses = accounts
          .map(account => (account as StoredHDAccount).tezosAddress)
          .filter((address): address is string => Boolean(address));
        return await fetchObjktOwnedCount(msg.contract, msg.tokenId, addresses.join(','));
      }

      case ContentScriptType.WebWidgetAdImpression: {
        await withNonImportErrorForwarding(async () => {
          const { postAdImpression, postAnonymousAdImpression } = await importAdsApiModule();
          const urlDomain = sender.tab?.url ? new URL(sender.tab.url).hostname : 'x.com';
          // Consent gate: with promo off, report, 'Unverified' rather than the user's real PKH.
          const promoStored = await browser.storage.local.get(WEBSITES_ADS_ENABLED);

          if (!promoStored[WEBSITES_ADS_ENABLED]) {
            await postAdImpression({ tezosAddress: 'Unverified', evmAddress: 'Unverified' }, msg.provider, {
              urlDomain
            });
            return;
          }

          const rewardsAddresses = await getRewardsAccountCredentials();
          if (rewardsAddresses.evmAddress) {
            await postAdImpression(rewardsAddresses, msg.provider, { urlDomain });
          } else {
            const identity = await getStoredAppInstallIdentity();
            if (!identity) throw new Error('App identity not found');
            await postAnonymousAdImpression(identity.publicKeyHash, msg.provider, { urlDomain });
          }
        });
        break;
      }

      case ContentScriptType.WebWidgetTrackEvent: {
        const analyticsStored = await browser.storage.local.get(USAGE_ANALYTICS_ENABLED);
        if (!analyticsStored[USAGE_ANALYTICS_ENABLED]) break;
        await Analytics.client.track(msg.event, msg.properties);
        break;
      }

      case ContentScriptType.WebWidgetSnooze: {
        await browser.storage.local.set({ [WEB_WIDGETS_SNOOZE_UNTIL]: Date.now() + WEB_WIDGETS_SNOOZE_DURATION_MS });
        break;
      }

      case ContentScriptType.WebWidgetDisable: {
        await browser.storage.local.set({
          [WEB_WIDGETS_TOKEN_INSIGHT_ENABLED]: false,
          [WEB_WIDGETS_SNOOZE_UNTIL]: 0,
          [WEB_WIDGETS_LOCAL_AD_PERMIT]: false
        });
        break;
      }

      case ContentScriptType.FetchTempleReferralLinkItems: {
        let browser = 'chrome';
        if (IS_FIREFOX) browser = 'firefox';
        if (IS_MISES_BROWSER) browser = 'mises';

        return await getTempleReferralLinkItems(browser);
      }

      case ContentScriptType.ReferralClick: {
        const { urlDomain, pageDomain, provider } = msg;

        await withNonImportErrorForwarding(async () => {
          // TakeAds merchant offer clicks use Jitsu userId
          if (provider === 'TakeAds') {
            const { postReferralClickByUserId } = await importAdsApiModule();
            const userId = await fetchFromStorage<string>(ANALYTICS_USER_ID_STORAGE_KEY);
            if (!userId) throw new Error('Analytics userId not found');
            await postReferralClickByUserId(userId, { urlDomain, pageDomain, provider });
          } else {
            const { postReferralClick } = await importAdsApiModule();
            const rewardsAddresses = await getRewardsAccountCredentials();
            if (rewardsAddresses.evmAddress) {
              await postReferralClick(rewardsAddresses, undefined, { urlDomain, pageDomain, provider });
            } else {
              const identity = await getStoredAppInstallIdentity();
              if (!identity) throw new Error('App identity not found');
              const installId = identity.publicKeyHash;
              await postReferralClick({}, installId, { urlDomain, pageDomain, provider });
            }
          }
        });
        break;
      }

      case ContentScriptType.FetchMerchantOffers: {
        const merchantState = await fetchFromStorage<DealsState>(DEALS_STORAGE_KEY);
        if (!merchantState?.enabled) return [];
        if (merchantState.snoozedUntil && Date.now() < merchantState.snoozedUntil) return [];

        return await withNonImportErrorForwarding(async () => {
          const { fetchMerchantOffers } = await importAdsApiModule();
          return await fetchMerchantOffers(msg.domains);
        });
      }

      case ContentScriptType.ActivateMerchantOffer: {
        return await withNonImportErrorForwarding(async () => {
          const { activateMerchantOffer } = await importAdsApiModule();
          const userId = await fetchFromStorage<string>(ANALYTICS_USER_ID_STORAGE_KEY);
          return await activateMerchantOffer(msg.url, userId ?? undefined);
        });
      }

      case ContentScriptType.MarkMerchantOfferActivated: {
        if (typeof msg.domain === 'string') merchantOfferSuppressedAt.set(msg.domain, Date.now());
        break;
      }

      case ContentScriptType.CheckAndConsumeMerchantOfferActivated: {
        if (typeof msg.domain !== 'string') return false;

        const suppressedAt = merchantOfferSuppressedAt.get(msg.domain);
        if (!suppressedAt) return false;

        if (Date.now() - suppressedAt >= MERCHANT_OFFER_SUPPRESSION_TTL) {
          merchantOfferSuppressedAt.delete(msg.domain);
          return false;
        }

        return true;
      }

      case ContentScriptType.MerchantOfferSnooze: {
        const merchantState = await fetchFromStorage<DealsState>(DEALS_STORAGE_KEY);
        await putToStorage(DEALS_STORAGE_KEY, {
          ...merchantState,
          snoozedUntil: Date.now() + 24 * 60 * 60 * 1000
        });
        break;
      }

      case ContentScriptType.MerchantOfferDisable: {
        await putToStorage(DEALS_STORAGE_KEY, {
          enabled: false,
          snoozedUntil: 0
        });
        break;
      }

      case ContentScriptType.MerchantOfferAnalytics: {
        const [analyticsEnabled, userId] = await Promise.all([
          fetchFromStorage<boolean>(USAGE_ANALYTICS_ENABLED),
          fetchFromStorage<string>(ANALYTICS_USER_ID_STORAGE_KEY)
        ]);

        if (!analyticsEnabled) break;

        const { event, properties, category } = msg;

        Analytics.trackEvent({
          userId: userId ?? '',
          chainId: undefined,
          event,
          category,
          properties
        });
        break;
      }

      case ContentScriptType.MarkDealsAnnouncementSeen: {
        await putToStorage(DEALS_ANNOUNCEMENT_SHOWN_STORAGE_KEY, true);
        break;
      }

      case ContentScriptType.ActivateDealsAnnouncement: {
        const merchantState = await fetchFromStorage<DealsState>(DEALS_STORAGE_KEY);
        await putToStorage(DEALS_STORAGE_KEY, {
          ...merchantState,
          enabled: true,
          snoozedUntil: 0
        });

        const userId = (await fetchFromStorage<string>(ANALYTICS_USER_ID_STORAGE_KEY)) ?? '';
        Analytics.trackEvent({
          userId,
          chainId: undefined,
          event: 'DealsEnabled',
          category: AnalyticsEventCategory.General,
          properties: {}
        });
        break;
      }

      case ContentScriptType.DealsAnnouncementAnalytics: {
        const allowedEvents = new Set([
          'DealsAnnouncementGoogleSearchView',
          'DealsAnnouncementGoogleSearchActivate',
          'DealsAnnouncementGoogleSearchClose'
        ]);

        const { event, category, properties } = msg;
        if (typeof event !== 'string' || !allowedEvents.has(event)) break;

        // Activation is always tracked
        if (event !== 'DealsAnnouncementGoogleSearchActivate') {
          const analyticsEnabled = await fetchFromStorage<boolean>(USAGE_ANALYTICS_ENABLED);
          if (!analyticsEnabled) break;
        }

        const userId = (await fetchFromStorage<string>(ANALYTICS_USER_ID_STORAGE_KEY)) ?? '';
        Analytics.trackEvent({
          userId,
          chainId: undefined,
          event,
          category,
          properties
        });
        break;
      }
    }
  } catch (e) {
    console.error(e);
  }

  return;
});

async function getAdsViewerCredentials(): Promise<AdsViewerData | Partial<Record<keyof AdsViewerData, undefined>>> {
  const credentialsFromStorage = await fetchFromStorage<AdsViewerData>(ADS_VIEWER_DATA_STORAGE_KEY);

  if (credentialsFromStorage) {
    return credentialsFromStorage;
  }

  const { accounts } = await Actions.getFrontState();

  const firstAccount = accounts[0] as StoredHDAccount | undefined;

  return firstAccount ? pick(firstAccount, ['tezosAddress', 'evmAddress']) : {};
}

async function getRewardsAccountCredentials() {
  const credentialsFromStorage = await fetchFromStorage<RewardsAddresses>(REWARDS_ACCOUNT_DATA_STORAGE_KEY);

  if (credentialsFromStorage) {
    return credentialsFromStorage;
  }

  return await getAdsViewerCredentials();
}

function buildWidgetAdUrl(origin: string, evmAddress?: string): string | null {
  if (!EnvVars.HYPELAB_ADS_WINDOW_URL || !EnvVars.HYPELAB_EXTERNAL_PROPERTY_SLUG) return null;
  if (!EnvVars.HYPELAB_EXTERNAL_NATIVE_WIDGET_PLACEMENT_SLUG) return null;

  const url = new URL(EnvVars.HYPELAB_ADS_WINDOW_URL);
  url.searchParams.set('ps', EnvVars.HYPELAB_EXTERNAL_PROPERTY_SLUG);
  url.searchParams.set('ap', 'hypelab');
  url.searchParams.set('p', EnvVars.HYPELAB_EXTERNAL_NATIVE_WIDGET_PLACEMENT_SLUG);
  url.searchParams.set('at', 'native');
  url.searchParams.set('w', '444');
  url.searchParams.set('h', '78');
  url.searchParams.set('id', crypto.randomUUID());
  if (evmAddress) url.searchParams.set('ea', evmAddress);
  url.searchParams.set('o', AES.encrypt(origin, EnvVars.TEMPLE_ADS_ORIGIN_PASSPHRASE).toString());
  return url.toString();
}

const DEFAULT_MEMO_CONFIG = {
  promise: true,
  max: 1,
  maxAge: 5 * 60_000
};

const getReferralsRules = memoizee(
  () =>
    withNonImportErrorForwarding(async () => {
      const { fetchReferralsRules } = await importAdsApiModule();
      return await fetchReferralsRules();
    }),
  DEFAULT_MEMO_CONFIG
);

const getTempleReferralLinkItems = memoizee(
  (browser: string) =>
    withNonImportErrorForwarding(async () => {
      const { fetchTempleReferralLinkItems } = await importAdsApiModule();
      return await fetchTempleReferralLinkItems(browser);
    }),
  DEFAULT_MEMO_CONFIG
);

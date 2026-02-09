import { pick } from 'lodash';
import memoizee from 'memoizee';
import browser, { Runtime } from 'webextension-polyfill';
import { ValidationError } from 'yup';

import { getStoredAppInstallIdentity } from 'app/storage/app-install-id';
import { importExtensionAdsReferralsModule } from 'lib/ads/import-extension-ads-module';
import { importUpdateRulesStorageModule } from 'lib/ads/import-update-rules-storage';
import { importAdsApiModule } from 'lib/apis/ads-api';
import {
  ADS_VIEWER_DATA_STORAGE_KEY,
  ContentScriptType,
  PAGE_ANALYSIS_THRESHOLDS,
  PAGE_KEYWORDS_STORAGE_KEY,
  REWARDS_ACCOUNT_DATA_STORAGE_KEY,
  SUGGESTIONS_CONFIG,
  TRADING_SUGGESTIONS_STORAGE_KEY
} from 'lib/constants';
import { E2eMessageType } from 'lib/e2e/types';
import { BACKGROUND_IS_WORKER, EnvVars, IS_FIREFOX, IS_MISES_BROWSER } from 'lib/env';
import {
  analyzePageContent,
  buildAnalysisRequest,
  type PageAnalysis,
  type PageKeywordsData,
  type TradingSuggestion
} from 'lib/page-keywords-scanner';
import { fetchFromStorage } from 'lib/storage';
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

          if (rewardsAddresses.evmAddress) await postAdImpression(rewardsAddresses, msg.provider, { urlDomain });
          else {
            const identity = await getStoredAppInstallIdentity();
            if (!identity) throw new Error('App identity not found');
            const installId = identity.publicKeyHash;
            await postAnonymousAdImpression(installId, urlDomain, msg.provider);
          }
        });
        break;
      }

      case ContentScriptType.FetchReferralsRules: {
        return await getReferralsRules();
      }

      case ContentScriptType.FetchTempleReferralLinkItems: {
        let browser = 'chrome';
        if (IS_FIREFOX) browser = 'firefox';
        if (IS_MISES_BROWSER) browser = 'mises';

        return await getTempleReferralLinkItems(browser);
      }

      case ContentScriptType.FetchTakeAdsReferrals: {
        if (BACKGROUND_IS_WORKER) {
          const { buildTakeadsClient } = await importExtensionAdsReferralsModule();
          const takeads = buildTakeadsClient(EnvVars.TAKE_ADS_TOKEN);
          return await takeads.affiliateLinks(msg.links);
        }

        return await withNonImportErrorForwarding(async () => {
          const { fetchReferralsAffiliateLinks } = await importAdsApiModule();

          return await fetchReferralsAffiliateLinks(msg.links);
        });
      }

      case ContentScriptType.ReferralClick: {
        const { urlDomain, pageDomain, provider } = msg;
        const rewardsAddresses = await getRewardsAccountCredentials();

        await withNonImportErrorForwarding(async () => {
          const { postReferralClick } = await importAdsApiModule();
          if (rewardsAddresses.evmAddress) {
            await postReferralClick(rewardsAddresses, undefined, { urlDomain, pageDomain, provider });
          } else {
            const identity = await getStoredAppInstallIdentity();
            if (!identity) throw new Error('App identity not found');
            const installId = identity.publicKeyHash;
            await postReferralClick({}, installId, { urlDomain, pageDomain, provider });
          }
        });
        break;
      }

      case ContentScriptType.PageKeywordsUpdate: {
        // Store keywords data for the current tab
        const keywordsData = msg.data as PageKeywordsData;
        if (keywordsData && keywordsData.result.uniqueCount > 0) {
          await browser.storage.local.set({ [PAGE_KEYWORDS_STORAGE_KEY]: keywordsData });

          // Check if backend analysis should be triggered
          const shouldAnalyze = await shouldTriggerBackendAnalysis(keywordsData);
          if (shouldAnalyze) {
            analyzePageContentInBackground(keywordsData).catch(err => {
              console.debug('[PageAnalysis] Background analysis failed:', err);
            });
          }
        }
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

const urlAnalysisTimestamps = new Map<string, number>();

function getUrlCooldownKey(url: string): string {
  try {
    const parsed = new URL(url);

    return `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return url;
  }
}

/**
 * Checks if the page data meets thresholds for backend analysis.
 * This helps reduce unnecessary API calls and costs.
 */
async function shouldTriggerBackendAnalysis(keywordsData: PageKeywordsData): Promise<boolean> {
  const { result, url } = keywordsData;
  const thresholds = PAGE_ANALYSIS_THRESHOLDS;

  if (result.uniqueCount < thresholds.MIN_KEYWORDS) {
    console.debug(`[PageAnalysis] Skipping: ${result.uniqueCount}/${thresholds.MIN_KEYWORDS} keywords`);

    return false;
  }

  const snippetCount = result.snippets?.length ?? 0;
  if (snippetCount < thresholds.MIN_SNIPPETS) {
    console.debug(`[PageAnalysis] Skipping: ${snippetCount}/${thresholds.MIN_SNIPPETS} snippets`);

    return false;
  }

  if (result.totalMatches < thresholds.MIN_TOTAL_MATCHES) {
    console.debug(`[PageAnalysis] Skipping: ${result.totalMatches}/${thresholds.MIN_TOTAL_MATCHES} matches`);

    return false;
  }

  if (result.categories.length < thresholds.MIN_CATEGORIES) {
    console.debug(`[PageAnalysis] Skipping: ${result.categories.length}/${thresholds.MIN_CATEGORIES} categories`);

    return false;
  }

  // Check URL cooldown (prevent analyzing same page too frequently)
  const urlKey = getUrlCooldownKey(url);
  const lastAnalysis = urlAnalysisTimestamps.get(urlKey);
  const now = Date.now();
  if (lastAnalysis && now - lastAnalysis < thresholds.URL_COOLDOWN_MS) {
    const remainingMs = thresholds.URL_COOLDOWN_MS - (now - lastAnalysis);
    console.debug(`[PageAnalysis] Skipping: URL cooldown (${Math.round(remainingMs / 1000)}s remaining)`);

    return false;
  }

  urlAnalysisTimestamps.set(urlKey, now);

  // Clean up old entries (keep map from growing indefinitely)
  if (urlAnalysisTimestamps.size > 200) {
    const cutoff = now - thresholds.URL_COOLDOWN_MS;
    for (const [key, timestamp] of urlAnalysisTimestamps) {
      if (timestamp < cutoff) {
        urlAnalysisTimestamps.delete(key);
      }
    }
  }

  console.debug('[PageAnalysis] Triggering analysis:', {
    url: urlKey,
    keywords: result.uniqueCount,
    snippets: snippetCount,
    matches: result.totalMatches,
    categories: result.categories.length
  });

  return true;
}

/** Stored suggestion entry with TTL */
interface StoredSuggestionEntry {
  urlKey: string;
  url: string;
  hostname: string;
  timestamp: number;
  expiresAt: number;
  analysis: PageAnalysis;
  suggestions: TradingSuggestion[];
}

/** Map of urlKey -> suggestion entry, persisted in storage */
type StoredSuggestionsMap = Record<string, StoredSuggestionEntry>;

/**
 * Stores a suggestion for a site, evicting expired and oldest entries.
 */
async function storeSuggestion(
  keywordsData: PageKeywordsData,
  response: { analysis: StoredSuggestionEntry['analysis']; suggestions: StoredSuggestionEntry['suggestions'] }
): Promise<void> {
  const stored = await fetchFromStorage<StoredSuggestionsMap>(TRADING_SUGGESTIONS_STORAGE_KEY);
  const map: StoredSuggestionsMap = stored ?? {};
  const now = Date.now();

  // Remove expired entries
  for (const [key, entry] of Object.entries(map)) {
    if (entry.expiresAt <= now) {
      delete map[key];
    }
  }

  // Add new entry
  const urlKey = getUrlCooldownKey(keywordsData.url);
  map[urlKey] = {
    urlKey,
    url: keywordsData.url,
    hostname: keywordsData.hostname,
    timestamp: now,
    expiresAt: now + SUGGESTIONS_CONFIG.SUGGESTION_TTL_MS,
    analysis: response.analysis,
    suggestions: response.suggestions
  };

  // Evict oldest entries if over limit
  const entries = Object.values(map).sort((a, b) => b.timestamp - a.timestamp);
  const maxEntries = SUGGESTIONS_CONFIG.MAX_STORED_SUGGESTIONS;
  if (entries.length > maxEntries) {
    const toKeep = new Set(entries.slice(0, maxEntries).map(e => e.urlKey));
    for (const key of Object.keys(map)) {
      if (!toKeep.has(key)) {
        delete map[key];
      }
    }
  }

  await browser.storage.local.set({ [TRADING_SUGGESTIONS_STORAGE_KEY]: map });
  console.debug(`[PageAnalysis] Suggestion stored for ${urlKey}, total: ${Object.keys(map).length}`);
}

/**
 * Analyze page content in the background using the backend LLM
 */
async function analyzePageContentInBackground(keywordsData: PageKeywordsData): Promise<void> {
  try {
    const request = buildAnalysisRequest(
      keywordsData.url,
      keywordsData.result.snippets || [],
      keywordsData.result.keywords.map(k => k.keyword),
      keywordsData.result.categories
    );

    const response = await analyzePageContent(request);

    if (response && response.hasTradingSignal) {
      console.debug('[PageAnalysis] Trading signal detected:', {
        sentiment: response.analysis.sentiment,
        confidence: response.analysis.confidence,
        suggestionsCount: response.suggestions.length
      });
      await storeSuggestion(keywordsData, response);
    } else {
      console.debug('[PageAnalysis] No trading signal in response:', {
        hasResponse: !!response,
        hasTradingSignal: response?.hasTradingSignal
      });
    }
  } catch (error) {
    console.error('[PageAnalysis] Background analysis error:', error);
  }
}

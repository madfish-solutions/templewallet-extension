import memoizee from 'memoizee';
import browser, { Runtime } from 'webextension-polyfill';

import { getStoredAppInstallIdentity } from 'app/storage/app-install-id';
import { importExtensionAdsReferralsModule } from 'lib/ads/import-extension-ads-module';
import { updateRulesStorage } from 'lib/ads/update-rules-storage';
import {
  fetchReferralsAffiliateLinks,
  fetchReferralsRules,
  postAdImpression,
  postAnonymousAdImpression,
  postReferralClick
} from 'lib/apis/ads-api';
import { ADS_VIEWER_ADDRESS_STORAGE_KEY, ContentScriptType } from 'lib/constants';
import { E2eMessageType } from 'lib/e2e/types';
import { BACKGROUND_IS_WORKER, EnvVars } from 'lib/env';
import { fetchFromStorage } from 'lib/storage';
import { encodeMessage, encryptMessage, getSenderId, MessageType, Response } from 'lib/temple/beacon';
import { clearAsyncStorages } from 'lib/temple/reset';
import { TempleMessageType, TempleRequest, TempleResponse } from 'lib/temple/types';
import { getTrackedCashbackServiceDomain, getTrackedUrl } from 'lib/utils/url-track/url-track.utils';

import * as Actions from './actions';
import * as Analytics from './analytics';
import { intercom } from './defaults';
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
  switch (req?.type) {
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

    case TempleMessageType.NewWalletRequest:
      const accountPkh = await Actions.registerNewWallet(req.password, req.mnemonic);
      return { type: TempleMessageType.NewWalletResponse, accountPkh };

    case TempleMessageType.UnlockRequest:
      await Actions.unlock(req.password);
      return { type: TempleMessageType.UnlockResponse };

    case TempleMessageType.LockRequest:
      await Actions.lock();
      return { type: TempleMessageType.LockResponse };

    case TempleMessageType.CreateAccountRequest:
      await Actions.createHDAccount(req.name);
      return { type: TempleMessageType.CreateAccountResponse };

    case TempleMessageType.RevealPublicKeyRequest:
      const publicKey = await Actions.revealPublicKey(req.accountPublicKeyHash);
      return {
        type: TempleMessageType.RevealPublicKeyResponse,
        publicKey
      };

    case TempleMessageType.RevealPrivateKeyRequest:
      const privateKey = await Actions.revealPrivateKey(req.accountPublicKeyHash, req.password);
      return {
        type: TempleMessageType.RevealPrivateKeyResponse,
        privateKey
      };

    case TempleMessageType.RevealMnemonicRequest:
      const mnemonic = await Actions.revealMnemonic(req.password);
      return {
        type: TempleMessageType.RevealMnemonicResponse,
        mnemonic
      };

    case TempleMessageType.GenerateSyncPayloadRequest:
      const payload = await Actions.generateSyncPayload(req.password);
      return {
        type: TempleMessageType.GenerateSyncPayloadResponse,
        payload
      };

    case TempleMessageType.RemoveAccountRequest:
      await Actions.removeAccount(req.accountPublicKeyHash, req.password);
      return {
        type: TempleMessageType.RemoveAccountResponse
      };

    case TempleMessageType.EditAccountRequest:
      await Actions.editAccount(req.accountPublicKeyHash, req.name);
      return {
        type: TempleMessageType.EditAccountResponse
      };

    case TempleMessageType.ImportAccountRequest:
      await Actions.importAccount(req.privateKey, req.encPassword);
      return {
        type: TempleMessageType.ImportAccountResponse
      };

    case TempleMessageType.ImportMnemonicAccountRequest:
      await Actions.importMnemonicAccount(req.mnemonic, req.password, req.derivationPath);
      return {
        type: TempleMessageType.ImportMnemonicAccountResponse
      };

    case TempleMessageType.ImportFundraiserAccountRequest:
      await Actions.importFundraiserAccount(req.email, req.password, req.mnemonic);
      return {
        type: TempleMessageType.ImportFundraiserAccountResponse
      };

    case TempleMessageType.ImportManagedKTAccountRequest:
      await Actions.importManagedKTAccount(req.address, req.chainId, req.owner);
      return {
        type: TempleMessageType.ImportManagedKTAccountResponse
      };

    case TempleMessageType.ImportWatchOnlyAccountRequest:
      await Actions.importWatchOnlyAccount(req.address, req.chainId);
      return {
        type: TempleMessageType.ImportWatchOnlyAccountResponse
      };

    case TempleMessageType.CreateLedgerAccountRequest:
      await Actions.createLedgerAccount(req.name, req.derivationPath, req.derivationType);
      return {
        type: TempleMessageType.CreateLedgerAccountResponse
      };

    case TempleMessageType.UpdateSettingsRequest:
      await Actions.updateSettings(req.settings);
      return {
        type: TempleMessageType.UpdateSettingsResponse
      };

    case TempleMessageType.OperationsRequest:
      const { opHash } = await Actions.sendOperations(port, req.id, req.sourcePkh, req.networkRpc, req.opParams);
      return {
        type: TempleMessageType.OperationsResponse,
        opHash
      };

    case TempleMessageType.SignRequest:
      const result = await Actions.sign(port, req.id, req.sourcePkh, req.bytes, req.watermark);
      return {
        type: TempleMessageType.SignResponse,
        result
      };

    case TempleMessageType.DAppGetAllSessionsRequest:
      const allSessions = await Actions.getAllDAppSessions();
      return {
        type: TempleMessageType.DAppGetAllSessionsResponse,
        sessions: allSessions
      };

    case TempleMessageType.DAppRemoveSessionRequest:
      const sessions = await Actions.removeDAppSession(req.origin);
      return {
        type: TempleMessageType.DAppRemoveSessionResponse,
        sessions
      };

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

        return {
          type: TempleMessageType.Acknowledge,
          payload: await encryptMessage(encodeMessage<Response>(response), recipientPubKey ?? ''),
          encrypted: true
        };
      }
      break;
    }

    case TempleMessageType.PageRequest:
      const dAppEnabled = await Actions.isDAppEnabled();
      if (dAppEnabled) {
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
      }
      break;
  }
};

const getAdsViewerPkh = async (): Promise<string | undefined> => {
  const accountPkhFromStorage = await fetchFromStorage<string>(ADS_VIEWER_ADDRESS_STORAGE_KEY);

  if (accountPkhFromStorage) {
    return accountPkhFromStorage;
  }

  const frontState = await Actions.getFrontState();

  return frontState.accounts[0]?.publicKeyHash;
};

browser.runtime.onMessage.addListener(async msg => {
  try {
    switch (msg?.type) {
      case ContentScriptType.UpdateAdsRules:
        await updateRulesStorage();
        return;
      case E2eMessageType.ResetRequest:
        return clearAsyncStorages().then(() => ({ type: E2eMessageType.ResetResponse }));
    }

    const accountPkh = await getAdsViewerPkh();

    switch (msg?.type) {
      case ContentScriptType.ExternalLinksActivity: {
        const trackedCashbackServiceDomain = getTrackedCashbackServiceDomain(msg.url);

        if (trackedCashbackServiceDomain) {
          await Analytics.client.track('External Cashback Links Activity', { domain: trackedCashbackServiceDomain });
        }

        const trackedUrl = getTrackedUrl(msg.url);

        if (trackedUrl) {
          await Analytics.client.track('External links activity', { url: trackedUrl, accountPkh });
        }

        break;
      }

      case ContentScriptType.ExternalAdsActivity: {
        const urlDomain = new URL(msg.url).hostname;
        if (accountPkh) await postAdImpression(accountPkh, msg.provider, { urlDomain });
        else {
          const identity = await getStoredAppInstallIdentity();
          if (!identity) throw new Error('App identity not found');
          const installId = identity.publicKeyHash;
          await postAnonymousAdImpression(installId, urlDomain, msg.provider);
        }
        break;
      }

      case ContentScriptType.FetchReferralsRules: {
        return await getReferralsRules();
      }

      case ContentScriptType.FetchReferrals: {
        if (BACKGROUND_IS_WORKER) {
          const { buildTakeadsClient } = await importExtensionAdsReferralsModule();
          const takeads = buildTakeadsClient(EnvVars.TAKE_ADS_TOKEN);
          return await takeads.affiliateLinks(msg.links);
        }

        // Not requesting from BG page because of CORS.
        return await fetchReferralsAffiliateLinks(msg.links);
      }

      case ContentScriptType.ReferralClick: {
        const { urlDomain, pageDomain } = msg;
        if (accountPkh) await postReferralClick(accountPkh, undefined, { urlDomain, pageDomain });
        else {
          const identity = await getStoredAppInstallIdentity();
          if (!identity) throw new Error('App identity not found');
          const installId = identity.publicKeyHash;
          await postReferralClick(undefined, installId, { urlDomain, pageDomain });
        }
        break;
      }
    }
  } catch (e) {
    console.error(e);
  }

  return;
});

const getReferralsRules = memoizee(fetchReferralsRules, {
  promise: true,
  max: 1,
  maxAge: 5 * 60_000
});

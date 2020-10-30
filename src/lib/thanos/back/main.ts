import { Runtime } from "webextension-polyfill-ts";
import { Queue } from "queue-ts";
import {
  ThanosMessageType,
  ThanosRequest,
  ThanosResponse,
} from "lib/thanos/types";
import { intercom } from "lib/thanos/back/defaults";
import { store, toFront } from "lib/thanos/back/store";
import * as Actions from "lib/thanos/back/actions";
import * as PndOps from "lib/thanos/back/pndops";

const frontStore = store.map(toFront);

export async function start() {
  intercom.onRequest(processRequest);
  await Actions.init();
  frontStore.watch(() => {
    intercom.broadcast({ type: ThanosMessageType.StateUpdated });
  });
}

async function processRequest(
  req: ThanosRequest,
  port: Runtime.Port
): Promise<ThanosResponse | void> {
  switch (req?.type) {
    case ThanosMessageType.GetStateRequest:
      const state = await Actions.getFrontState();
      return {
        type: ThanosMessageType.GetStateResponse,
        state,
      };

    case ThanosMessageType.NewWalletRequest:
      await Actions.registerNewWallet(req.password, req.mnemonic);
      return { type: ThanosMessageType.NewWalletResponse };

    case ThanosMessageType.UnlockRequest:
      await Actions.unlock(req.password);
      return { type: ThanosMessageType.UnlockResponse };

    case ThanosMessageType.LockRequest:
      await Actions.lock();
      return { type: ThanosMessageType.LockResponse };

    case ThanosMessageType.CreateAccountRequest:
      await Actions.createHDAccount(req.name);
      return { type: ThanosMessageType.CreateAccountResponse };

    case ThanosMessageType.RevealPublicKeyRequest:
      const publicKey = await Actions.revealPublicKey(req.accountPublicKeyHash);
      return {
        type: ThanosMessageType.RevealPublicKeyResponse,
        publicKey,
      };

    case ThanosMessageType.RevealPrivateKeyRequest:
      const privateKey = await Actions.revealPrivateKey(
        req.accountPublicKeyHash,
        req.password
      );
      return {
        type: ThanosMessageType.RevealPrivateKeyResponse,
        privateKey,
      };

    case ThanosMessageType.RevealMnemonicRequest:
      const mnemonic = await Actions.revealMnemonic(req.password);
      return {
        type: ThanosMessageType.RevealMnemonicResponse,
        mnemonic,
      };

    case ThanosMessageType.RemoveAccountRequest:
      await Actions.removeAccount(req.accountPublicKeyHash, req.password);
      return {
        type: ThanosMessageType.RemoveAccountResponse,
      };

    case ThanosMessageType.EditAccountRequest:
      await Actions.editAccount(req.accountPublicKeyHash, req.name);
      return {
        type: ThanosMessageType.EditAccountResponse,
      };

    case ThanosMessageType.ImportAccountRequest:
      await Actions.importAccount(req.privateKey, req.encPassword);
      return {
        type: ThanosMessageType.ImportAccountResponse,
      };

    case ThanosMessageType.ImportMnemonicAccountRequest:
      await Actions.importMnemonicAccount(
        req.mnemonic,
        req.password,
        req.derivationPath
      );
      return {
        type: ThanosMessageType.ImportMnemonicAccountResponse,
      };

    case ThanosMessageType.ImportFundraiserAccountRequest:
      await Actions.importFundraiserAccount(
        req.email,
        req.password,
        req.mnemonic
      );
      return {
        type: ThanosMessageType.ImportFundraiserAccountResponse,
      };

    case ThanosMessageType.ImportManagedKTAccountRequest:
      await Actions.importManagedKTAccount(req.address, req.chainId, req.owner);
      return {
        type: ThanosMessageType.ImportManagedKTAccountResponse,
      };

    case ThanosMessageType.CreateLedgerAccountRequest:
      await Actions.craeteLedgerAccount(req.name, req.derivationPath);
      return {
        type: ThanosMessageType.CreateLedgerAccountResponse,
      };

    case ThanosMessageType.UpdateSettingsRequest:
      await Actions.updateSettings(req.settings);
      return {
        type: ThanosMessageType.UpdateSettingsResponse,
      };

    case ThanosMessageType.GetAllPndOpsRequest:
      const operations = await PndOps.getAll(
        req.accountPublicKeyHash,
        req.netId
      );
      return {
        type: ThanosMessageType.GetAllPndOpsResponse,
        operations,
      };

    case ThanosMessageType.RemovePndOpsRequest:
      await PndOps.remove(req.accountPublicKeyHash, req.netId, req.opHashes);
      return {
        type: ThanosMessageType.RemovePndOpsResponse,
      };

    case ThanosMessageType.OperationsRequest:
      const { opHash } = await Actions.sendOperations(
        port,
        req.id,
        req.sourcePkh,
        req.networkRpc,
        req.opParams
      );
      return {
        type: ThanosMessageType.OperationsResponse,
        opHash,
      };

    case ThanosMessageType.SignRequest:
      const result = await Actions.sign(
        port,
        req.id,
        req.sourcePkh,
        req.bytes,
        req.watermark
      );
      return {
        type: ThanosMessageType.SignResponse,
        result,
      };

    case ThanosMessageType.DAppGetAllSessionsRequest:
      const allSessions = await Actions.getAllDAppSessions();
      return {
        type: ThanosMessageType.DAppGetAllSessionsResponse,
        sessions: allSessions,
      };

    case ThanosMessageType.DAppRemoveSessionRequest:
      const sessions = await Actions.removeDAppSession(req.origin);
      return {
        type: ThanosMessageType.DAppRemoveSessionResponse,
        sessions,
      };

    case ThanosMessageType.PageRequest:
      const dAppEnabled = await Actions.isDAppEnabled();
      if (dAppEnabled) {
        if (req.payload === "PING") {
          return {
            type: ThanosMessageType.PageResponse,
            payload: "PONG",
          };
        } else if (req.beacon && req.payload === "ping") {
          return {
            type: ThanosMessageType.PageResponse,
            payload: "pong",
          };
        }

        return enqueueDAppPrecessing(port, async () => {
          const action = req.beacon
            ? Actions.processBeacon
            : Actions.processDApp;
          const resPayload = await action(req.origin, req.payload);
          if (resPayload) {
            return {
              type: ThanosMessageType.PageResponse,
              payload: resPayload,
            };
          }
          return;
        });
      }
      break;
  }
}

const dAppsQueue = new Queue(1);

async function enqueueDAppPrecessing<T>(
  port: Runtime.Port,
  factory: () => Promise<T>
) {
  return new Promise<T>((response, reject) => {
    let connected = true;
    const stopDisconnectListening = intercom.onDisconnect(port, () => {
      connected = false;
      reject(new Error("Disconnected"));
    });

    dAppsQueue.add(async () => {
      stopDisconnectListening();
      if (!connected) return;

      return factory().then(response).catch(reject);
    });
  });
}

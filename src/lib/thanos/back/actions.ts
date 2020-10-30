import { browser, Runtime } from "webextension-polyfill-ts";
import {
  ThanosDAppMessageType,
  ThanosDAppErrorType,
  ThanosDAppRequest,
  ThanosDAppResponse,
} from "@thanos-wallet/dapp/dist/types";
import {
  ThanosState,
  ThanosMessageType,
  ThanosRequest,
  ThanosSettings,
  ThanosSharedStorageKey,
} from "lib/thanos/types";
import { loadChainId } from "lib/thanos/helpers";
import { intercom } from "lib/thanos/back/defaults";
import {
  toFront,
  store,
  inited,
  locked,
  unlocked,
  accountsUpdated,
  settingsUpdated,
  withInited,
  withUnlocked,
} from "lib/thanos/back/store";
import { Vault } from "lib/thanos/back/vault";
import {
  requestPermission,
  requestOperation,
  requestSign,
  requestBroadcast,
  getAllDApps,
  removeDApp,
} from "lib/thanos/back/dapp";
import * as PndOps from "lib/thanos/back/pndops";
import * as Beacon from "lib/thanos/beacon";

const ACCOUNT_NAME_PATTERN = /^[a-zA-Z0-9 _-]{1,16}$/;
const AUTODECLINE_AFTER = 60_000;
const BEACON_ID = `thanos_wallet_${browser.runtime.id}`;

export async function init() {
  const vaultExist = await Vault.isExist();
  inited(vaultExist);
}

export async function getFrontState(): Promise<ThanosState> {
  const state = store.getState();
  if (state.inited) {
    return toFront(state);
  } else {
    await new Promise((r) => setTimeout(r, 10));
    return getFrontState();
  }
}

export async function isDAppEnabled() {
  const key = ThanosSharedStorageKey.DAppEnabled;
  const items = await browser.storage.local.get([key]);
  return key in items ? items[key] : true;
}

export function registerNewWallet(password: string, mnemonic?: string) {
  return withInited(async () => {
    await Vault.spawn(password, mnemonic);
    await unlock(password);
  });
}

export function lock() {
  return withInited(async () => {
    locked();
  });
}

export function unlock(password: string) {
  return withInited(async () => {
    const vault = await Vault.setup(password);
    const accounts = await vault.fetchAccounts();
    const settings = await vault.fetchSettings();
    unlocked({ vault, accounts, settings });
  });
}

export function createHDAccount(name?: string) {
  return withUnlocked(async ({ vault }) => {
    if (name) {
      name = name.trim();
      if (!ACCOUNT_NAME_PATTERN.test(name)) {
        throw new Error(
          "Invalid name. It should be: 1-16 characters, without special"
        );
      }
    }

    const updatedAccounts = await vault.createHDAccount(name);
    accountsUpdated(updatedAccounts);
  });
}

export function revealMnemonic(password: string) {
  return withUnlocked(() => Vault.revealMnemonic(password));
}

export function revealPrivateKey(accPublicKeyHash: string, password: string) {
  return withUnlocked(() => Vault.revealPrivateKey(accPublicKeyHash, password));
}

export function revealPublicKey(accPublicKeyHash: string) {
  return withUnlocked(({ vault }) => vault.revealPublicKey(accPublicKeyHash));
}

export function removeAccount(accPublicKeyHash: string, password: string) {
  return withUnlocked(async () => {
    const updatedAccounts = await Vault.removeAccount(
      accPublicKeyHash,
      password
    );
    accountsUpdated(updatedAccounts);
  });
}

export function editAccount(accPublicKeyHash: string, name: string) {
  return withUnlocked(async ({ vault }) => {
    name = name.trim();
    if (!ACCOUNT_NAME_PATTERN.test(name)) {
      throw new Error(
        "Invalid name. It should be: 1-16 characters, without special"
      );
    }

    const updatedAccounts = await vault.editAccountName(accPublicKeyHash, name);
    accountsUpdated(updatedAccounts);
  });
}

export function importAccount(privateKey: string, encPassword?: string) {
  return withUnlocked(async ({ vault }) => {
    const updatedAccounts = await vault.importAccount(privateKey, encPassword);
    accountsUpdated(updatedAccounts);
  });
}

export function importMnemonicAccount(
  mnemonic: string,
  password?: string,
  derivationPath?: string
) {
  return withUnlocked(async ({ vault }) => {
    const updatedAccounts = await vault.importMnemonicAccount(
      mnemonic,
      password,
      derivationPath
    );
    accountsUpdated(updatedAccounts);
  });
}

export function importFundraiserAccount(
  email: string,
  password: string,
  mnemonic: string
) {
  return withUnlocked(async ({ vault }) => {
    const updatedAccounts = await vault.importFundraiserAccount(
      email,
      password,
      mnemonic
    );
    accountsUpdated(updatedAccounts);
  });
}

export function importManagedKTAccount(
  address: string,
  chainId: string,
  owner: string
) {
  return withUnlocked(async ({ vault }) => {
    const updatedAccounts = await vault.importManagedKTAccount(
      address,
      chainId,
      owner
    );
    accountsUpdated(updatedAccounts);
  });
}

export function craeteLedgerAccount(name: string, derivationPath?: string) {
  return withUnlocked(async ({ vault }) => {
    const updatedAccounts = await vault.createLedgerAccount(
      name,
      derivationPath
    );
    accountsUpdated(updatedAccounts);
  });
}

export function updateSettings(settings: Partial<ThanosSettings>) {
  return withUnlocked(async ({ vault }) => {
    const updatedSettings = await vault.updateSettings(settings);
    settingsUpdated(updatedSettings);
  });
}

export function getAllDAppSessions() {
  return getAllDApps();
}

export function removeDAppSession(origin: string) {
  return removeDApp(origin);
}

export function sendOperations(
  port: Runtime.Port,
  id: string,
  sourcePkh: string,
  networkRpc: string,
  opParams: any[]
): Promise<{ opHash: string }> {
  return withUnlocked(
    () =>
      new Promise(async (resolve, reject) => {
        intercom.notify(port, {
          type: ThanosMessageType.ConfirmationRequested,
          id,
          payload: {
            type: "operations",
            sourcePkh,
            networkRpc,
            opParams,
          },
        });

        let closing = false;
        const close = () => {
          if (closing) return;
          closing = true;

          try {
            stopTimeout();
            stopRequestListening();
            stopDisconnectListening();

            intercom.notify(port, {
              type: ThanosMessageType.ConfirmationExpired,
              id,
            });
          } catch (_err) {}
        };

        const decline = () => {
          reject(new Error("Declined"));
        };
        const declineAndClose = () => {
          decline();
          close();
        };

        const stopRequestListening = intercom.onRequest(
          async (req: ThanosRequest, reqPort) => {
            if (
              reqPort === port &&
              req?.type === ThanosMessageType.ConfirmationRequest &&
              req?.id === id
            ) {
              if (req.confirmed) {
                try {
                  const op = await withUnlocked(({ vault }) =>
                    vault.sendOperations(sourcePkh, networkRpc, opParams)
                  );

                  try {
                    const chainId = await loadChainId(networkRpc);
                    const pndOps = PndOps.fromOpResults(op.results, op.hash);
                    await PndOps.append(sourcePkh, chainId, pndOps);
                  } catch {}

                  resolve({ opHash: op.hash });
                } catch (err) {
                  if (err?.message?.startsWith("__tezos__")) {
                    reject(new Error(err.message));
                  } else {
                    throw err;
                  }
                }
              } else {
                decline();
              }

              close();

              return {
                type: ThanosMessageType.ConfirmationResponse,
              };
            }
            return;
          }
        );

        const stopDisconnectListening = intercom.onDisconnect(
          port,
          declineAndClose
        );

        // Decline after timeout
        const t = setTimeout(declineAndClose, AUTODECLINE_AFTER);
        const stopTimeout = () => clearTimeout(t);
      })
  );
}

export function sign(
  port: Runtime.Port,
  id: string,
  sourcePkh: string,
  bytes: string,
  watermark?: string
) {
  return withUnlocked(
    () =>
      new Promise(async (resolve, reject) => {
        intercom.notify(port, {
          type: ThanosMessageType.ConfirmationRequested,
          id,
          payload: {
            type: "sign",
            sourcePkh,
            bytes,
            watermark,
          },
        });

        let closing = false;
        const close = () => {
          if (closing) return;
          closing = true;

          try {
            stopTimeout();
            stopRequestListening();
            stopDisconnectListening();

            intercom.notify(port, {
              type: ThanosMessageType.ConfirmationExpired,
              id,
            });
          } catch (_err) {}
        };

        const decline = () => {
          reject(new Error("Declined"));
        };
        const declineAndClose = () => {
          decline();
          close();
        };

        const stopRequestListening = intercom.onRequest(
          async (req: ThanosRequest, reqPort) => {
            if (
              reqPort === port &&
              req?.type === ThanosMessageType.ConfirmationRequest &&
              req?.id === id
            ) {
              if (req.confirmed) {
                const result = await withUnlocked(({ vault }) =>
                  vault.sign(sourcePkh, bytes, watermark)
                );
                resolve(result);
              } else {
                decline();
              }

              close();

              return {
                type: ThanosMessageType.ConfirmationResponse,
              };
            }
            return;
          }
        );

        const stopDisconnectListening = intercom.onDisconnect(
          port,
          declineAndClose
        );

        // Decline after timeout
        const t = setTimeout(declineAndClose, AUTODECLINE_AFTER);
        const stopTimeout = () => clearTimeout(t);
      })
  );
}

export async function processDApp(
  origin: string,
  req: ThanosDAppRequest
): Promise<ThanosDAppResponse | void> {
  switch (req?.type) {
    case ThanosDAppMessageType.PermissionRequest:
      return withInited(() => requestPermission(origin, req));

    case ThanosDAppMessageType.OperationRequest:
      return withInited(() => requestOperation(origin, req));

    case ThanosDAppMessageType.SignRequest:
      return withInited(() => requestSign(origin, req));

    case ThanosDAppMessageType.BroadcastRequest:
      return withInited(() => requestBroadcast(origin, req));
  }
}

export async function processBeacon(origin: string, msg: string) {
  const req = Beacon.decodeMessage<Beacon.Request>(msg);
  const resBase = {
    version: req.version,
    beaconId: BEACON_ID,
    id: req.id,
  };

  const res = await (async (): Promise<Beacon.Response> => {
    try {
      try {
        const thanosReq = ((): ThanosDAppRequest | void => {
          switch (req.type) {
            case Beacon.MessageType.PermissionRequest:
              const network =
                req.network.type === "custom"
                  ? {
                      name: req.network.name!,
                      rpc: req.network.rpcUrl!,
                    }
                  : req.network.type;

              return {
                type: ThanosDAppMessageType.PermissionRequest,
                network,
                appMeta: req.appMetadata,
                force: true,
              };

            case Beacon.MessageType.OperationRequest:
              return {
                type: ThanosDAppMessageType.OperationRequest,
                sourcePkh: req.sourceAddress,
                opParams: req.operationDetails.map(Beacon.formatOpParams),
              };

            case Beacon.MessageType.SignPayloadRequest:
              return {
                type: ThanosDAppMessageType.SignRequest,
                sourcePkh: req.sourceAddress,
                payload: req.payload,
              };

            case Beacon.MessageType.BroadcastRequest:
              return {
                type: ThanosDAppMessageType.BroadcastRequest,
                signedOpBytes: req.signedTransaction,
              };
          }
        })();

        if (thanosReq) {
          const thanosRes = await processDApp(origin, thanosReq);

          if (thanosRes) {
            // Map Thanos DApp response to Beacon response
            switch (thanosRes.type) {
              case ThanosDAppMessageType.PermissionResponse:
                return {
                  ...resBase,
                  type: Beacon.MessageType.PermissionResponse,
                  publicKey: (thanosRes as any).publicKey,
                  network: (req as Beacon.PermissionRequest).network,
                  scopes: [
                    Beacon.PermissionScope.OPERATION_REQUEST,
                    Beacon.PermissionScope.SIGN,
                  ],
                };

              case ThanosDAppMessageType.OperationResponse:
                return {
                  ...resBase,
                  type: Beacon.MessageType.OperationResponse,
                  transactionHash: thanosRes.opHash,
                };

              case ThanosDAppMessageType.SignResponse:
                return {
                  ...resBase,
                  type: Beacon.MessageType.SignPayloadResponse,
                  signature: thanosRes.signature,
                };

              case ThanosDAppMessageType.BroadcastResponse:
                return {
                  ...resBase,
                  type: Beacon.MessageType.BroadcastResponse,
                  transactionHash: thanosRes.opHash,
                };
            }
          }
        }

        throw new Error(Beacon.ErrorType.UNKNOWN_ERROR);
      } catch (err) {
        // Map Thanos DApp error to Beacon error
        const beaconErrorType = (() => {
          if (err?.message.startsWith("__tezos__")) {
            return Beacon.ErrorType.BROADCAST_ERROR;
          }

          switch (err?.message) {
            case ThanosDAppErrorType.InvalidParams:
              return Beacon.ErrorType.PARAMETERS_INVALID_ERROR;

            case ThanosDAppErrorType.NotFound:
            case ThanosDAppErrorType.NotGranted:
              return Beacon.ErrorType.NOT_GRANTED_ERROR;

            default:
              return err?.message;
          }
        })();

        throw new Error(beaconErrorType);
      }
    } catch (err) {
      return {
        ...resBase,
        type: Beacon.MessageType.Error,
        errorType:
          err?.message in Beacon.ErrorType
            ? err.message
            : Beacon.ErrorType.UNKNOWN_ERROR,
      };
    }
  })();

  return Beacon.encodeMessage<Beacon.Response>(res);
}

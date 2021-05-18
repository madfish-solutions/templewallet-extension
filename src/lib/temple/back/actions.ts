import { DerivationType } from "@taquito/ledger-signer";
import { TezosOperationError } from "@taquito/taquito";
import {
  TempleDAppMessageType,
  TempleDAppErrorType,
  TempleDAppRequest,
  TempleDAppResponse,
} from "@temple-wallet/dapp/dist/types";
import { browser, Runtime } from "webextension-polyfill-ts";

import { addLocalOperation } from "lib/temple/activity";
import {
  getCurrentPermission,
  requestPermission,
  requestOperation,
  requestSign,
  requestBroadcast,
  getAllDApps,
  removeDApp,
} from "lib/temple/back/dapp";
import { intercom } from "lib/temple/back/defaults";
import { buildFinalOpParmas, dryRunOpParams } from "lib/temple/back/dryrun";
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
} from "lib/temple/back/store";
import { Vault } from "lib/temple/back/vault";
import * as Beacon from "lib/temple/beacon";
import { loadChainId } from "lib/temple/helpers";
import {
  TempleState,
  TempleMessageType,
  TempleRequest,
  TempleSettings,
  TempleSharedStorageKey,
} from "lib/temple/types";

const ACCOUNT_NAME_PATTERN = /^[a-zA-Z0-9 _-]{1,16}$/;
const AUTODECLINE_AFTER = 60_000;
const BEACON_ID = `temple_wallet_${browser.runtime.id}`;

export async function init() {
  const vaultExist = await Vault.isExist();
  inited(vaultExist);
}

export async function getFrontState(): Promise<TempleState> {
  const state = store.getState();
  if (state.inited) {
    return toFront(state);
  } else {
    await new Promise((r) => setTimeout(r, 10));
    return getFrontState();
  }
}

export async function isDAppEnabled() {
  const bools = await Promise.all([
    Vault.isExist(),
    (async () => {
      const key = TempleSharedStorageKey.DAppEnabled;
      const items = await browser.storage.local.get([key]);
      return key in items ? items[key] : true;
    })(),
  ]);

  return bools.every(Boolean);
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

export function importWatchOnlyAccount(address: string, chainId?: string) {
  return withUnlocked(async ({ vault }) => {
    const updatedAccounts = await vault.importWatchOnlyAccount(
      address,
      chainId
    );
    accountsUpdated(updatedAccounts);
  });
}

export function craeteLedgerAccount(
  name: string,
  derivationPath?: string,
  derivationType?: DerivationType
) {
  return withUnlocked(async ({ vault }) => {
    const updatedAccounts = await vault.createLedgerAccount(
      name,
      derivationPath,
      derivationType
    );
    accountsUpdated(updatedAccounts);
  });
}

export function updateSettings(settings: Partial<TempleSettings>) {
  return withUnlocked(async ({ vault }) => {
    const updatedSettings = await vault.updateSettings(settings);
    createCustomNetworksSnapshot(updatedSettings);
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
  return withUnlocked(async () => {
    const sourcePublicKey = await revealPublicKey(sourcePkh);
    const dryRunResult = await dryRunOpParams({
      opParams,
      networkRpc,
      sourcePkh,
      sourcePublicKey,
    });

    return new Promise(async (resolve, reject) => {
      intercom.notify(port, {
        type: TempleMessageType.ConfirmationRequested,
        id,
        payload: {
          type: "operations",
          sourcePkh,
          networkRpc,
          opParams,
          ...(dryRunResult ?? {}),
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
            type: TempleMessageType.ConfirmationExpired,
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
        async (req: TempleRequest, reqPort) => {
          if (
            reqPort === port &&
            req?.type === TempleMessageType.ConfirmationRequest &&
            req?.id === id
          ) {
            if (req.confirmed) {
              try {
                const op = await withUnlocked(({ vault }) =>
                  vault.sendOperations(
                    sourcePkh,
                    networkRpc,
                    buildFinalOpParmas(
                      opParams,
                      dryRunResult?.estimates,
                      req.modifiedStorageLimit
                    )
                  )
                );

                try {
                  const chainId = await loadChainId(networkRpc);
                  await addLocalOperation(chainId, op.hash, op.results);
                } catch {}

                resolve({ opHash: op.hash });
              } catch (err) {
                if (err instanceof TezosOperationError) {
                  reject(err);
                } else {
                  throw err;
                }
              }
            } else {
              decline();
            }

            close();

            return {
              type: TempleMessageType.ConfirmationResponse,
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
    });
  });
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
          type: TempleMessageType.ConfirmationRequested,
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
              type: TempleMessageType.ConfirmationExpired,
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
          async (req: TempleRequest, reqPort) => {
            if (
              reqPort === port &&
              req?.type === TempleMessageType.ConfirmationRequest &&
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
                type: TempleMessageType.ConfirmationResponse,
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
  req: TempleDAppRequest
): Promise<TempleDAppResponse | void> {
  switch (req?.type) {
    case TempleDAppMessageType.GetCurrentPermissionRequest:
      return withInited(() => getCurrentPermission(origin));

    case TempleDAppMessageType.PermissionRequest:
      return withInited(() => requestPermission(origin, req));

    case TempleDAppMessageType.OperationRequest:
      return withInited(() => requestOperation(origin, req));

    case TempleDAppMessageType.SignRequest:
      return withInited(() => requestSign(origin, req));

    case TempleDAppMessageType.BroadcastRequest:
      return withInited(() => requestBroadcast(origin, req));
  }
}

export async function processBeacon(
  origin: string,
  msg: string,
  encrypted = false
) {
  let recipientPubKey: string | null = null;

  if (encrypted) {
    try {
      recipientPubKey = await Beacon.getDAppPublicKey(origin);
      if (!recipientPubKey) throw new Error("<stub>");

      try {
        msg = await Beacon.decryptMessage(msg, recipientPubKey);
      } catch (err) {
        await Beacon.removeDAppPublicKey(origin);
        throw err;
      }
    } catch {
      return {
        payload: Beacon.encodeMessage<Beacon.Response>({
          version: "2",
          senderId: await Beacon.getSenderId(),
          id: "stub",
          type: Beacon.MessageType.Disconnect,
        }),
      };
    }
  }

  let req: Beacon.Request;
  try {
    req = Beacon.decodeMessage<Beacon.Request>(msg);
  } catch {
    return;
  }

  // Process Disconnect
  if (req.type === Beacon.MessageType.Disconnect) {
    await removeDApp(origin);
    return;
  }

  const resBase = {
    version: req.version,
    id: req.id,
    ...(req.beaconId
      ? { beaconId: BEACON_ID }
      : { senderId: await Beacon.getSenderId() }),
  };

  // Process handshake
  if (req.type === Beacon.MessageType.HandshakeRequest) {
    await Beacon.saveDAppPublicKey(origin, req.publicKey);
    const keyPair = await Beacon.getOrCreateKeyPair();
    return {
      payload: await Beacon.sealCryptobox(
        JSON.stringify({
          ...resBase,
          ...Beacon.PAIRING_RESPONSE_BASE,
          publicKey: Beacon.toHex(keyPair.publicKey),
        }),
        Beacon.fromHex(req.publicKey)
      ),
    };
  }

  const res = await (async (): Promise<Beacon.Response> => {
    try {
      try {
        const templeReq = ((): TempleDAppRequest | void => {
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
                type: TempleDAppMessageType.PermissionRequest,
                network: network === "edonet" ? "edo2net" : (network as any),
                appMeta: req.appMetadata,
                force: true,
              };

            case Beacon.MessageType.OperationRequest:
              return {
                type: TempleDAppMessageType.OperationRequest,
                sourcePkh: req.sourceAddress,
                opParams: req.operationDetails.map(Beacon.formatOpParams),
              };

            case Beacon.MessageType.SignPayloadRequest:
              return {
                type: TempleDAppMessageType.SignRequest,
                sourcePkh: req.sourceAddress,
                payload:
                  req.signingType === Beacon.SigningType.RAW
                    ? Buffer.from(req.payload, "utf8").toString("hex")
                    : req.payload,
              };

            case Beacon.MessageType.BroadcastRequest:
              return {
                type: TempleDAppMessageType.BroadcastRequest,
                signedOpBytes: req.signedTransaction,
              };
          }
        })();

        if (templeReq) {
          const templeRes = await processDApp(origin, templeReq);

          if (templeRes) {
            // Map Temple DApp response to Beacon response
            switch (templeRes.type) {
              case TempleDAppMessageType.PermissionResponse:
                return {
                  ...resBase,
                  type: Beacon.MessageType.PermissionResponse,
                  publicKey: (templeRes as any).publicKey,
                  network: (req as Beacon.PermissionRequest).network,
                  scopes: [
                    Beacon.PermissionScope.OPERATION_REQUEST,
                    Beacon.PermissionScope.SIGN,
                  ],
                };

              case TempleDAppMessageType.OperationResponse:
                return {
                  ...resBase,
                  type: Beacon.MessageType.OperationResponse,
                  transactionHash: templeRes.opHash,
                };

              case TempleDAppMessageType.SignResponse:
                return {
                  ...resBase,
                  type: Beacon.MessageType.SignPayloadResponse,
                  signature: templeRes.signature,
                };

              case TempleDAppMessageType.BroadcastResponse:
                return {
                  ...resBase,
                  type: Beacon.MessageType.BroadcastResponse,
                  transactionHash: templeRes.opHash,
                };
            }
          }
        }

        throw new Error(Beacon.ErrorType.UNKNOWN_ERROR);
      } catch (err) {
        if (err instanceof TezosOperationError) {
          throw err;
        }

        // Map Temple DApp error to Beacon error
        const beaconErrorType = (() => {
          switch (err?.message) {
            case TempleDAppErrorType.InvalidParams:
              return Beacon.ErrorType.PARAMETERS_INVALID_ERROR;

            case TempleDAppErrorType.NotFound:
            case TempleDAppErrorType.NotGranted:
              return req.beaconId
                ? Beacon.ErrorType.NOT_GRANTED_ERROR
                : Beacon.ErrorType.ABORTED_ERROR;

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
        errorType: (() => {
          switch (true) {
            case err instanceof TezosOperationError:
              return Beacon.ErrorType.TRANSACTION_INVALID_ERROR;

            case err?.message in Beacon.ErrorType:
              return err.message;

            default:
              return Beacon.ErrorType.UNKNOWN_ERROR;
          }
        })(),
        errorData: getErrorData(err),
      };
    }
  })();

  const resMsg = Beacon.encodeMessage<Beacon.Response>(res);
  if (encrypted && recipientPubKey) {
    return {
      payload: await Beacon.encryptMessage(resMsg, recipientPubKey),
      encrypted: true,
    };
  }
  return { payload: resMsg };
}

async function createCustomNetworksSnapshot(settings: TempleSettings) {
  try {
    if (settings.customNetworks) {
      await browser.storage.local.set({
        custom_networks_snapshot: settings.customNetworks,
      });
    }
  } catch {}
}

function getErrorData(err: any) {
  return err instanceof TezosOperationError
    ? err.errors.map(({ contract_code, ...rest }: any) => rest)
    : undefined;
}

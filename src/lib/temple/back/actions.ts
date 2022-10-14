import { DerivationType } from '@taquito/ledger-signer';
import { TezosOperationError } from '@taquito/taquito';
import { char2Bytes } from '@taquito/utils';
import {
  TempleDAppMessageType,
  TempleDAppErrorType,
  TempleDAppRequest,
  TempleDAppResponse,
  BeaconMessageWrapper,
  TempleDAppRequestV3,
  TempleDAppResponseV3,
  TempleDAppBroadcastResponse,
  TempleDAppOperationResponse,
  TempleDAppOperationResponseV3,
  TempleDAppSignResponse,
  TempleDAppPermissionResponse,
  TempleDAppPermissionRequestV3,
  TempleDAppPermissionRequest
} from '@temple-wallet/dapp/dist/types';
import { browser, Runtime } from 'webextension-polyfill-ts';

import { createQueue } from 'lib/queue';
import { addLocalOperation } from 'lib/temple/activity';
import {
  getCurrentPermission,
  requestPermission,
  requestOperation,
  requestSign,
  requestBroadcast,
  getAllDApps,
  removeDApp
} from 'lib/temple/back/dapp';
import { intercom } from 'lib/temple/back/defaults';
import { buildFinalOpParmas, dryRunOpParams } from 'lib/temple/back/dryrun';
import {
  toFront,
  store,
  inited,
  locked,
  unlocked,
  accountsUpdated,
  settingsUpdated,
  withInited,
  withUnlocked
} from 'lib/temple/back/store';
import { Vault } from 'lib/temple/back/vault';
import * as Beacon from 'lib/temple/beacon';
import { loadChainId } from 'lib/temple/helpers';
import {
  TempleState,
  TempleMessageType,
  TempleRequest,
  TempleSettings,
  TempleSharedStorageKey
} from 'lib/temple/types';

const ACCOUNT_NAME_PATTERN = /^.{0,16}$/;
const AUTODECLINE_AFTER = 60_000;
const BEACON_ID = `temple_wallet_${browser.runtime.id}`;

const enqueueDApp = createQueue();
const enqueueUnlock = createQueue();

export async function init() {
  const vaultExist = await Vault.isExist();
  inited(vaultExist);
}

export async function getFrontState(): Promise<TempleState> {
  const state = store.getState();
  if (state.inited) {
    return toFront(state);
  } else {
    await new Promise(r => setTimeout(r, 10));
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
    })()
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
  return withInited(() =>
    enqueueUnlock(async () => {
      const vault = await Vault.setup(password);
      const accounts = await vault.fetchAccounts();
      const settings = await vault.fetchSettings();
      unlocked({ vault, accounts, settings });
    })
  );
}

export function createHDAccount(name?: string) {
  return withUnlocked(async ({ vault }) => {
    if (name) {
      name = name.trim();
      if (!ACCOUNT_NAME_PATTERN.test(name)) {
        throw new Error('Invalid name. It should be: 1-16 characters, without special');
      }
    }

    const updatedAccounts = await vault.createHDAccount(name);
    accountsUpdated(updatedAccounts);
  });
}

export function revealMnemonic(password: string) {
  return withUnlocked(() => Vault.revealMnemonic(password));
}

export function generateSyncPayload(password: string) {
  return withUnlocked(() => Vault.generateSyncPayload(password));
}

export function revealPrivateKey(accPublicKeyHash: string, password: string) {
  return withUnlocked(() => Vault.revealPrivateKey(accPublicKeyHash, password));
}

export function revealPublicKey(accPublicKeyHash: string) {
  return withUnlocked(({ vault }) => vault.revealPublicKey(accPublicKeyHash));
}

export function removeAccount(accPublicKeyHash: string, password: string) {
  return withUnlocked(async () => {
    const updatedAccounts = await Vault.removeAccount(accPublicKeyHash, password);
    accountsUpdated(updatedAccounts);
  });
}

export function editAccount(accPublicKeyHash: string, name: string) {
  return withUnlocked(async ({ vault }) => {
    name = name.trim();
    if (!ACCOUNT_NAME_PATTERN.test(name)) {
      throw new Error('Invalid name. It should be: 1-16 characters, without special');
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

export function importMnemonicAccount(mnemonic: string, password?: string, derivationPath?: string) {
  return withUnlocked(async ({ vault }) => {
    const updatedAccounts = await vault.importMnemonicAccount(mnemonic, password, derivationPath);
    accountsUpdated(updatedAccounts);
  });
}

export function importFundraiserAccount(email: string, password: string, mnemonic: string) {
  return withUnlocked(async ({ vault }) => {
    const updatedAccounts = await vault.importFundraiserAccount(email, password, mnemonic);
    accountsUpdated(updatedAccounts);
  });
}

export function importManagedKTAccount(address: string, chainId: string, owner: string) {
  return withUnlocked(async ({ vault }) => {
    const updatedAccounts = await vault.importManagedKTAccount(address, chainId, owner);
    accountsUpdated(updatedAccounts);
  });
}

export function importWatchOnlyAccount(address: string, chainId?: string) {
  return withUnlocked(async ({ vault }) => {
    const updatedAccounts = await vault.importWatchOnlyAccount(address, chainId);
    accountsUpdated(updatedAccounts);
  });
}

export function createLedgerAccount(name: string, derivationPath?: string, derivationType?: DerivationType) {
  return withUnlocked(async ({ vault }) => {
    const updatedAccounts = await vault.createLedgerAccount(name, derivationPath, derivationType);
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
      sourcePublicKey
    });
    if (dryRunResult && dryRunResult.result) {
      opParams = (dryRunResult.result as any).opParams;
    }

    return new Promise((resolve, reject) =>
      promisableUnlock(resolve, reject, port, id, sourcePkh, networkRpc, opParams, dryRunResult)
    );
  });
}

const promisableUnlock = async (
  resolve: any,
  reject: any,
  port: Runtime.Port,
  id: string,
  sourcePkh: string,
  networkRpc: string,
  opParams: any[],
  dryRunResult: any
) => {
  intercom.notify(port, {
    type: TempleMessageType.ConfirmationRequested,
    id,
    payload: {
      type: 'operations',
      sourcePkh,
      networkRpc,
      opParams,
      ...((dryRunResult && dryRunResult.result) ?? {})
    },
    ...(dryRunResult && dryRunResult.error ? { error: dryRunResult } : {})
  });

  let closing = false;

  const decline = () => {
    reject(new Error('Declined'));
  };
  const declineAndClose = () => {
    decline();
    closing = close(closing, port, id, stopTimeout, stopRequestListening, stopDisconnectListening);
  };

  const stopRequestListening = intercom.onRequest(async (req: TempleRequest, reqPort) => {
    if (reqPort === port && req?.type === TempleMessageType.ConfirmationRequest && req?.id === id) {
      if (req.confirmed) {
        try {
          const op = await withUnlocked(({ vault }) =>
            vault.sendOperations(
              sourcePkh,
              networkRpc,
              buildFinalOpParmas(opParams, req.modifiedTotalFee, req.modifiedStorageLimit)
            )
          );

          await safeAddLocalOperation(networkRpc, op);

          resolve({ opHash: op.hash });
        } catch (err: any) {
          if (err instanceof TezosOperationError) {
            reject(err);
          } else {
            throw err;
          }
        }
      } else {
        decline();
      }

      closing = close(closing, port, id, stopTimeout, stopRequestListening, stopDisconnectListening);

      return {
        type: TempleMessageType.ConfirmationResponse
      };
    }
    return undefined;
  });

  const stopDisconnectListening = intercom.onDisconnect(port, declineAndClose);

  // Decline after timeout
  const t = setTimeout(declineAndClose, AUTODECLINE_AFTER);
  const stopTimeout = () => clearTimeout(t);
};

const safeAddLocalOperation = async (networkRpc: string, op: any) => {
  try {
    const chainId = await loadChainId(networkRpc);
    await addLocalOperation(chainId, op.hash, op.results);
  } catch {}
  return undefined;
};

export function sign(port: Runtime.Port, id: string, sourcePkh: string, bytes: string, watermark?: string) {
  return withUnlocked(
    () =>
      new Promise(async (resolve, reject) => {
        intercom.notify(port, {
          type: TempleMessageType.ConfirmationRequested,
          id,
          payload: {
            type: 'sign',
            sourcePkh,
            bytes,
            watermark
          }
        });

        let closing = false;

        const decline = () => {
          reject(new Error('Declined'));
        };
        const declineAndClose = () => {
          decline();
          closing = close(closing, port, id, stopTimeout, stopRequestListening, stopDisconnectListening);
        };

        const stopRequestListening = intercom.onRequest(async (req: TempleRequest, reqPort) => {
          if (reqPort === port && req?.type === TempleMessageType.ConfirmationRequest && req?.id === id) {
            if (req.confirmed) {
              const result = await withUnlocked(({ vault }) => vault.sign(sourcePkh, bytes, watermark));
              resolve(result);
            } else {
              decline();
            }

            closing = close(closing, port, id, stopTimeout, stopRequestListening, stopDisconnectListening);

            return {
              type: TempleMessageType.ConfirmationResponse
            };
          }
          return undefined;
        });

        const stopDisconnectListening = intercom.onDisconnect(port, declineAndClose);

        // Decline after timeout
        const t = setTimeout(declineAndClose, AUTODECLINE_AFTER);
        const stopTimeout = () => clearTimeout(t);
      })
  );
}

export async function processDApp(
  origin: string,
  req: TempleDAppRequest | TempleDAppRequestV3
): Promise<TempleDAppResponse | TempleDAppResponseV3> {
  const v2 = req as TempleDAppRequest;
  const v3 = req as TempleDAppRequestV3;
  const type = v3.message ? v3.message.type : v2.type;

  switch (type) {
    case TempleDAppMessageType.GetCurrentPermissionRequest:
      return withInited(() => getCurrentPermission(origin));

    case TempleDAppMessageType.PermissionRequest:
      return withInited(() => enqueueDApp(() => requestPermission(origin, req)));

    case TempleDAppMessageType.OperationRequest:
      return withInited(() => enqueueDApp(() => requestOperation(origin, req)));

    case TempleDAppMessageType.SignRequest:
      return withInited(() => enqueueDApp(() => requestSign(origin, req)));

    case TempleDAppMessageType.BroadcastRequest:
      return withInited(() => requestBroadcast(origin, req));

    default: {
      throw new Error('reqtype not matching cases ');
    }
  }
}

export async function getBeaconMessage(origin: string, msg: string, encrypted = false) {
  let recipientPubKey: string | null = null;
  let payload = null;

  if (encrypted) {
    try {
      recipientPubKey = await Beacon.getDAppPublicKey(origin);
      if (!recipientPubKey) throw new Error('<stub>');

      try {
        msg = await Beacon.decryptMessage(msg, recipientPubKey);
      } catch (err: any) {
        alert(JSON.stringify(err));
        await Beacon.removeDAppPublicKey(origin);
        throw err;
      }
    } catch (err) {
      alert('catch of Beacon.getDAppPublicKey or more ...');
      alert(JSON.stringify(err));
      payload = {
        payload: Beacon.encodeMessage<Beacon.Response>({
          version: '2',
          senderId: await Beacon.getSenderId(),
          id: 'stub',
          type: Beacon.MessageType.Disconnect
        })
      };
    }
  }

  let req: Beacon.Request | Beacon.RequestV3 | null;
  try {
    req = Beacon.decodeMessage<Beacon.Request>(msg);
  } catch (err) {
    alert(err);
    req = null;
  }

  return {
    recipientPubKey,
    req,
    payload
  };
}

type ProcessedBeaconMessage = {
  payload: string;
  encrypted?: boolean;
};

export async function processBeacon(
  origin: string,
  msg: string,
  encrypted = false
): Promise<ProcessedBeaconMessage | undefined> {
  const { req, recipientPubKey, payload } = await getBeaconMessage(origin, msg, encrypted);

  const v2 = req as Beacon.Request;

  if (payload) {
    return payload;
  }
  if (!req) {
    return;
  }

  // Process Disconnect
  if (v2.type === Beacon.MessageType.Disconnect) {
    await removeDApp(origin);
    return;
  }

  const resBase = {
    version: req.version,
    id: req.id,
    ...(req.beaconId ? { beaconId: BEACON_ID } : { senderId: await Beacon.getSenderId() })
  };

  // Process handshake
  if (v2.type === Beacon.MessageType.HandshakeRequest) {
    await Beacon.saveDAppPublicKey(origin, v2.publicKey);
    const keyPair = await Beacon.getOrCreateKeyPair();
    return {
      payload: await Beacon.sealCryptobox(
        JSON.stringify({
          ...resBase,
          ...Beacon.PAIRING_RESPONSE_BASE,
          publicKey: Beacon.toHex(keyPair.publicKey)
        }),
        Beacon.fromHex(v2.publicKey)
      )
    };
  }

  const res = await getBeaconResponse(req, resBase, origin);

  const resMsg = Beacon.encodeMessage<Beacon.Response | Beacon.ResponseV3>(res);
  if (encrypted && recipientPubKey) {
    return {
      payload: await Beacon.encryptMessage(resMsg, recipientPubKey),
      encrypted: true
    };
  }

  return { payload: resMsg };
}

const getBeaconResponse = async (
  req: Beacon.Request | Beacon.RequestV3,
  resBase: any,
  origin: string
): Promise<Beacon.Response | Beacon.ResponseV3> => {
  try {
    try {
      return await formatTempleReq(getTempleReq(req), req, resBase, origin);
    } catch (err: any) {
      alert(JSON.stringify(err));
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
            return req.beaconId ? Beacon.ErrorType.NOT_GRANTED_ERROR : Beacon.ErrorType.ABORTED_ERROR;

          default:
            return err?.message;
        }
      })();

      throw new Error(beaconErrorType);
    }
  } catch (err: any) {
    alert(JSON.stringify(err));
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
      errorData: getErrorData(err)
    };
  }
};

/**
 * Converts Beacon.Request | Beacon.RequestV3 to TempleDAppRequest | TempleDAppRequestV3
 * @param req
 * @returns
 */
const getTempleReq = (req: Beacon.Request | Beacon.RequestV3): TempleDAppRequest | TempleDAppRequestV3 => {
  const v2 = req as Beacon.Request;
  const v3 = req as Beacon.RequestV3;

  const type: string = v3.message ? v3.message.type : v2.type;

  switch (type) {
    case Beacon.MessageType.PermissionRequest: {
      const request = req as Beacon.PermissionRequest;
      const reqPermissionBlockchain = v3 as BeaconMessageWrapper<Beacon.DekuPermissionRequest>;
      if (reqPermissionBlockchain.message) {
        reqPermissionBlockchain.message.blockchainData.network =
          reqPermissionBlockchain.message.blockchainData.network.type === 'custom'
            ? {
                name: reqPermissionBlockchain.message.blockchainData.network.name!,
                rpcUrl: reqPermissionBlockchain.message.blockchainData.network.rpcUrl!
              }
            : reqPermissionBlockchain.message.blockchainData.network;

        return {
          id: reqPermissionBlockchain.id,
          version: reqPermissionBlockchain.version,
          senderId: reqPermissionBlockchain.senderId,
          message: {
            type: TempleDAppMessageType.PermissionRequest,
            network: reqPermissionBlockchain.message.blockchainData.network,
            appMeta: { name: reqPermissionBlockchain.message.blockchainData.appMetadata.name },
            force: true,
            blockchainData: reqPermissionBlockchain.message.blockchainData,
            blockchainIdentifier: reqPermissionBlockchain.message.blockchainIdentifier
          }
        } as BeaconMessageWrapper<TempleDAppPermissionRequestV3>;
      } else {
        alert('PermissionRequest');
        request.network =
          request.network.type === 'custom'
            ? {
                name: request.network.name!,
                rpcUrl: request.network.rpcUrl!
              }
            : request.network;
        return {
          type: TempleDAppMessageType.PermissionRequest,
          network: request.network,
          appMeta: request.appMetadata,
          force: true
        } as TempleDAppPermissionRequest;
      }
    }

    case Beacon.MessageType.OperationRequest: {
      const request: Beacon.OperationRequest = req as Beacon.OperationRequest;
      return {
        type: TempleDAppMessageType.OperationRequest,
        sourcePkh: request.sourceAddress,
        opParams: request.operationDetails.map(Beacon.formatOpParams)
      };
    }
    case Beacon.MessageType.SignPayloadRequest: {
      const request: Beacon.SignRequest = req as Beacon.SignRequest;
      return {
        type: TempleDAppMessageType.SignRequest,
        sourcePkh: request.sourceAddress,
        payload:
          request.signingType === Beacon.SigningType.RAW ? generateRawPayloadBytes(request.payload) : request.payload
      };
    }
    case Beacon.MessageType.BroadcastRequest: {
      const request: Beacon.BroadcastRequest = req as Beacon.BroadcastRequest;
      return {
        type: TempleDAppMessageType.BroadcastRequest,
        signedOpBytes: request.signedTransaction
      };
    }

    default: {
      alert('Cannot find Message type');
      alert(type);
      throw new Error('Cannot find Message type' + type);
    }
  }
};

/**
 * Convert templeReq to Beacon.Response | Beacon.ResponseV3
 * @param templeReq
 * @param req
 * @param resBase
 * @param v3
 * @param origin
 * @returns
 */
const formatTempleReq = async (
  templeReq: TempleDAppRequest | TempleDAppRequestV3,
  req: Beacon.Request | Beacon.RequestV3,
  resBase: any,
  origin: string
): Promise<Beacon.Response | Beacon.ResponseV3> => {
  if (templeReq) {
    const templeRes: TempleDAppResponse | TempleDAppResponseV3 = await processDApp(origin, templeReq);
    alert('after await processDApp(origin, templeReq);');
    alert(JSON.stringify(templeRes));
    return new Promise((resolve, _) => {
      if (templeRes) {
        const v2Res = templeRes as TempleDAppResponse;
        const v3Res = templeRes as TempleDAppResponseV3;
        const type = v3Res.message ? v3Res.message.type : v2Res.type;

        // Map Temple DApp response to Beacon response
        switch (type) {
          case TempleDAppMessageType.PermissionResponse: {
            return resolve(
              !v3Res.message
                ? ({
                    ...resBase,
                    type: Beacon.MessageType.PermissionResponse,
                    publicKey: (v2Res as TempleDAppPermissionResponse).publicKey,
                    network: (req as Beacon.PermissionRequest).network,
                    scopes: [Beacon.PermissionScope.OPERATION_REQUEST, Beacon.PermissionScope.SIGN]
                  } as Beacon.PermissionResponse)
                : ({
                    ...resBase,
                    message: {
                      blockchainIdentifier: v3Res.message.blockchainIdentifier,
                      type: Beacon.MessageType.PermissionResponse,
                      blockchainData: v3Res.message.blockchainData
                    }
                  } as Beacon.ResponseV3)
            );
          }
          case TempleDAppMessageType.OperationResponse:
            return resolve(
              !v3Res.message
                ? ({
                    ...resBase,
                    type: Beacon.MessageType.OperationResponse,
                    transactionHash: (v2Res as TempleDAppOperationResponse).opHash
                  } as Beacon.OperationResponse)
                : ({
                    ...resBase,
                    message: {
                      type: Beacon.MessageType.OperationResponse,
                      transactionHash: (v3Res as unknown as TempleDAppOperationResponseV3).transactionHash
                    }
                  } as Beacon.DekuTransferResponse)
            );

          case TempleDAppMessageType.SignResponse:
            return resolve(
              !v3Res.message
                ? ({
                    ...resBase,
                    type: Beacon.MessageType.SignPayloadResponse,
                    signature: (v2Res as TempleDAppSignResponse).signature
                  } as Beacon.SignResponse)
                : ({
                    //FIXME V2 for the moment
                    ...resBase,
                    type: Beacon.MessageType.SignPayloadResponse,
                    signature: (v2Res as TempleDAppSignResponse).signature
                  } as Beacon.SignResponse)
            );

          case TempleDAppMessageType.BroadcastResponse:
            return resolve(
              !v3Res.message
                ? ({
                    ...resBase,
                    type: Beacon.MessageType.BroadcastResponse,
                    transactionHash: (v2Res as TempleDAppBroadcastResponse).opHash
                  } as Beacon.BroadcastResponse)
                : ({
                    //FIXME V2 for the moment
                    ...resBase,
                    type: Beacon.MessageType.BroadcastResponse,
                    transactionHash: (v2Res as TempleDAppBroadcastResponse).opHash
                  } as Beacon.BroadcastResponse)
            );
        }
      }
    });
  } else {
    alert(`No templeReq`);
    return new Promise((_, reject) => {
      reject(new Error(Beacon.ErrorType.UNKNOWN_ERROR));
    });
  }
};

async function createCustomNetworksSnapshot(settings: TempleSettings) {
  try {
    if (settings.customNetworks) {
      await browser.storage.local.set({
        custom_networks_snapshot: settings.customNetworks
      });
    }
  } catch {}
}

function getErrorData(err: any) {
  return err instanceof TezosOperationError ? err.errors.map(({ contract_code, ...rest }: any) => rest) : undefined;
}

function generateRawPayloadBytes(payload: string) {
  const bytes = char2Bytes(Buffer.from(payload, 'utf8').toString('hex'));
  // https://tezostaquito.io/docs/signing/
  return `0501${char2Bytes(String(bytes.length))}${bytes}`;
}

const close = (
  closing: boolean,
  port: Runtime.Port,
  id: string,
  stopTimeout: any,
  stopRequestListening: any,
  stopDisconnectListening: any
) => {
  let innerClosing = closing;
  if (innerClosing) return innerClosing;
  innerClosing = true;

  try {
    stopTimeout();
    stopRequestListening();
    stopDisconnectListening();

    intercom.notify(port, {
      type: TempleMessageType.ConfirmationExpired,
      id
    });
  } catch (_err) {}
  return innerClosing;
};

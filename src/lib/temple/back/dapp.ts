import { localForger } from '@taquito/local-forging';
import { valueDecoder } from '@taquito/local-forging/dist/lib/michelson/codec';
import { Uint8ArrayConsumer } from '@taquito/local-forging/dist/lib/uint8array-consumer';
import { emitMicheline } from '@taquito/michel-codec';
import { RpcClient } from '@taquito/rpc';
import { TezosOperationError } from '@taquito/taquito';
import {
  TempleDAppMessageType,
  TempleDAppErrorType,
  TempleDAppGetCurrentPermissionResponse,
  TempleDAppPermissionRequest,
  TempleDAppPermissionResponse,
  TempleDAppOperationRequest,
  TempleDAppOperationResponse,
  TempleDAppSignRequest,
  TempleDAppSignResponse,
  TempleDAppBroadcastRequest,
  TempleDAppBroadcastResponse,
  TempleDAppNetwork,
  TempleDAppPermissionRequestV3,
  TempleDAppMetadata,
  TempleDAppPermissionResponseV3,
  BeaconMessageWrapper,
  TempleDAppRequest,
  TempleDAppRequestV3,
  TempleDAppBlockchainResponseV3,
  TempleDAppBlockchainRequestV3
} from '@temple-wallet/dapp/dist/types';
import { nanoid } from 'nanoid';
import { browser, Runtime } from 'webextension-polyfill-ts';

import { addLocalOperation } from 'lib/temple/activity';
import { intercom } from 'lib/temple/back/defaults';
import { buildFinalOpParmas, dryRunOpParams } from 'lib/temple/back/dryrun';
import { withUnlocked } from 'lib/temple/back/store';
import * as Beacon from 'lib/temple/beacon';
import { loadChainId, isAddressValid } from 'lib/temple/helpers';
import { NETWORKS } from 'lib/temple/networks';
import {
  TempleMessageType,
  TempleRequest,
  TempleDAppPayload,
  TempleDAppSession,
  TempleDAppSessions
} from 'lib/temple/types';

const CONFIRM_WINDOW_WIDTH = 380;
const CONFIRM_WINDOW_HEIGHT = 632;
const AUTODECLINE_AFTER = 120_000;
const STORAGE_KEY = 'dapp_sessions';
const HEX_PATTERN = /^[0-9a-fA-F]+$/;
const TEZ_MSG_SIGN_PATTERN = /^0501[a-f0-9]{8}54657a6f73205369676e6564204d6573736167653a20[a-f0-9]*$/;

export async function getCurrentPermission(origin: string): Promise<TempleDAppGetCurrentPermissionResponse> {
  const dApp = await getDApp(origin);
  const permission = dApp
    ? {
        rpc: await getNetworkRPC(dApp.network),
        pkh: dApp.pkh,
        publicKey: dApp.publicKey
      }
    : null;
  return {
    type: TempleDAppMessageType.GetCurrentPermissionResponse,
    permission
  };
}

export async function requestPermission(
  origin: string,
  req: TempleDAppRequest | TempleDAppRequestV3
): Promise<TempleDAppPermissionResponse | BeaconMessageWrapper<TempleDAppPermissionResponseV3>> {
  let network: TempleDAppNetwork;
  let appMeta: TempleDAppMetadata;
  //let force: boolean;

  const v3 = req as BeaconMessageWrapper<TempleDAppPermissionRequestV3>;
  const v2 = req as TempleDAppPermissionRequest;

  if (v3.message) {
    network = v3.message.blockchainData.network;
    appMeta = v3.message.blockchainData.appMetadata;
    //force = true;
  } else {
    network = v2.network;
    appMeta = v2.appMeta;
    //force = v2.force ? v2.force : false;
  }

  if (![isAllowedNetwork(network), typeof appMeta?.name === 'string'].every(Boolean)) {
    throw new Error(TempleDAppErrorType.InvalidParams);
  }

  const networkRpc = await getNetworkRPC(network);
  //const dApp = await getDApp(origin);

  /*
  if (force && dApp && isNetworkEquals(network, dApp.network) && appMeta.name === dApp.appMeta.name) {
    alert('forcing return with no promise ...???');
    return {
      type: TempleDAppMessageType.PermissionResponse,
      rpc: networkRpc,
      pkh: dApp.pkh,
      publicKey: dApp.publicKey
    };
  }*/

  return new Promise(async (resolve, reject) => {
    const id = nanoid();

    await requestConfirm({
      id,
      payload: {
        type: 'connect',
        origin,
        networkRpc,
        appMeta: appMeta
      },
      onDecline: () => {
        alert('onDecline not granted ?');
        reject(new Error(TempleDAppErrorType.NotGranted));
      },
      handleIntercomRequest: async (confirmReq, decline): Promise<any> => {
        if (confirmReq?.type === TempleMessageType.DAppPermConfirmationRequest && confirmReq?.id === id) {
          const { confirmed, accountPublicKeyHash, accountPublicKey } = confirmReq;
          if (confirmed && accountPublicKeyHash && accountPublicKey) {
            await setDApp(origin, {
              network: network,
              appMeta: appMeta,
              pkh: accountPublicKeyHash,
              publicKey: accountPublicKey
            });

            resolve(
              !v3.message
                ? ({
                    type: TempleDAppMessageType.PermissionResponse,
                    pkh: accountPublicKeyHash,
                    publicKey: accountPublicKey,
                    rpc: networkRpc
                  } as TempleDAppPermissionResponse)
                : ({
                    id: v3.id,
                    version: v3.version,
                    senderId: v3.senderId,
                    message: {
                      blockchainIdentifier: v3.message.blockchainIdentifier,
                      type: TempleDAppMessageType.PermissionResponse,
                      blockchainData: {
                        ...v3.message.blockchainData,
                        accounts: [
                          {
                            accountId: 'account',
                            publicKey: accountPublicKey,
                            address: accountPublicKeyHash,
                            network: { ...v3.message.blockchainData.network }
                          }
                        ]
                      }
                    }
                  } as BeaconMessageWrapper<TempleDAppPermissionResponseV3>)
            );
          } else {
            alert('onDecline not granted ? confirmed && accountPublicKeyHash && accountPublicKey');
            decline();
          }

          return {
            type: TempleMessageType.DAppPermConfirmationResponse
          };
        }
        return undefined;
      }
    });
  });
}

export async function requestOperation(origin: string, req: TempleDAppRequest): Promise<TempleDAppOperationResponse> {
  const v2 = req as TempleDAppOperationRequest;

  const sourcePkh = v2.sourcePkh;
  const opParams = v2.opParams;

  if (
    ![
      isAddressValid(sourcePkh),
      v2?.opParams?.length > 0,
      v2?.opParams?.every(op => typeof op.kind === 'string')
    ].every(Boolean)
  ) {
    throw new Error(TempleDAppErrorType.InvalidParams);
  }

  const dApp = await getDApp(origin);

  if (!dApp) {
    throw new Error(TempleDAppErrorType.NotGranted);
  }

  if (sourcePkh !== dApp.pkh) {
    throw new Error(TempleDAppErrorType.NotFound);
  }

  return new Promise(async (resolve, reject) => {
    const id = nanoid();
    const networkRpc = await getNetworkRPC(dApp.network);

    await requestConfirm({
      id,
      payload: {
        type: 'confirm_operations',
        origin,
        networkRpc,
        appMeta: dApp.appMeta,
        sourcePkh: sourcePkh,
        sourcePublicKey: dApp.publicKey,
        opParams: opParams
      },
      onDecline: () => {
        reject(new Error(TempleDAppErrorType.NotGranted));
      },
      handleIntercomRequest: (confirmReq, decline) =>
        handleIntercomRequest(confirmReq, decline, id, dApp, networkRpc, v2, resolve, reject)
    });
  });
}

export async function requestBlockchain(
  origin: string,
  req: TempleDAppRequestV3
): Promise<BeaconMessageWrapper<TempleDAppBlockchainResponseV3>> {
  alert('requestBlockchain');
  const v3 = req as BeaconMessageWrapper<TempleDAppBlockchainRequestV3>;

  const dApp = await getDApp(origin);

  if (!dApp) {
    throw new Error(TempleDAppErrorType.NotGranted);
  }

  if (v3.message.blockchainData.sourceAddress !== dApp.pkh) {
    throw new Error(TempleDAppErrorType.NotFound);
  }

  return new Promise(async (resolve, reject) => {
    const id = nanoid();
    const networkRpc = await getNetworkRPC(dApp.network);

    alert('calling requestConfirm');
    await requestConfirm({
      id,
      payload: {
        type: 'confirm_operations', //FIXME ???
        origin,
        networkRpc,
        appMeta: dApp.appMeta,
        sourcePkh: v3.message.blockchainData.sourceAddress,
        sourcePublicKey: dApp.publicKey,
        opParams: [] //FIXME
      },
      onDecline: () => {
        reject(new Error(TempleDAppErrorType.NotGranted));
      },
      handleIntercomRequest: (confirmReq, decline) =>
        handleIntercomRequest(confirmReq, decline, id, dApp, networkRpc, v3, resolve, reject)
    });
  });
}

const handleIntercomRequest = async (
  confirmReq: TempleRequest,
  decline: () => void,
  id: string,
  dApp: TempleDAppSession,
  networkRpc: string,
  req: TempleDAppOperationRequest | BeaconMessageWrapper<TempleDAppBlockchainRequestV3>,
  resolve: any,
  reject: any
) => {
  alert('begin handleIntercomRequest');

  const reqV2 = req as TempleDAppOperationRequest;
  //FIXME const reqV3 = req as BeaconMessageWrapper<TempleDAppBlockchainRequestV3>;

  if (confirmReq?.type === TempleMessageType.DAppOpsConfirmationRequest && confirmReq?.id === id) {
    if (confirmReq.confirmed) {
      try {
        const op = await withUnlocked(({ vault }) => {
          alert('vault.sendOperations');
          return vault.sendOperations(
            dApp.pkh,
            networkRpc,
            buildFinalOpParmas(
              reqV2.opParams, //FIXME
              confirmReq.modifiedTotalFee,
              confirmReq.modifiedStorageLimit
            )
          );
        });

        alert('safeGetChain');
        safeGetChain(networkRpc, op);

        alert('resolve {type: TempleDAppMessageType.OperationResponse...');
        resolve({
          type: TempleDAppMessageType.OperationResponse,
          opHash: op.hash
        });
      } catch (err: any) {
        alert(JSON.stringify(err));
        if (err instanceof TezosOperationError) {
          err.message = TempleDAppErrorType.TezosOperation;
          reject(err);
        } else {
          reject(err);
        }
      }
    } else {
      decline();
    }

    return {
      type: TempleMessageType.DAppOpsConfirmationResponse
    };
  } else {
    alert('confirmReq?.type === TempleMessageType.DAppOpsConfirmationRequest && confirmReq?.id === id => is false');
    throw new Error('confirmReq is not DAppOpsConfirmationRequest and identifiers are different');
  }
};

const safeGetChain = async (networkRpc: string, op: any) => {
  try {
    const chainId = await loadChainId(networkRpc);
    await addLocalOperation(chainId, op.hash, op.results);
  } catch {}
};

export async function requestSign(origin: string, req: TempleDAppRequest): Promise<TempleDAppSignResponse> {
  let v2 = req as TempleDAppSignRequest;

  if (v2?.payload?.startsWith('0x')) {
    v2 = { ...v2, payload: v2.payload.substring(2) };
  }

  if (![isAddressValid(v2?.sourcePkh), HEX_PATTERN.test(v2?.payload)].every(Boolean)) {
    throw new Error(TempleDAppErrorType.InvalidParams);
  }

  const dApp = await getDApp(origin);

  if (!dApp) {
    throw new Error(TempleDAppErrorType.NotGranted);
  }

  if (v2.sourcePkh !== dApp.pkh) {
    throw new Error(TempleDAppErrorType.NotFound);
  }

  return new Promise((resolve, reject) => generatePromisifySign(resolve, reject, dApp, v2));
}

const generatePromisifySign = async (
  resolve: any,
  reject: any,
  dApp: TempleDAppSession,
  req: TempleDAppSignRequest
) => {
  const id = nanoid();
  const networkRpc = await getNetworkRPC(dApp.network);

  let preview: any;
  try {
    const value = valueDecoder(Uint8ArrayConsumer.fromHexString(req.payload.slice(2)));
    const parsed = emitMicheline(value, {
      indent: '  ',
      newline: '\n'
    }).slice(1, -1);

    if (req.payload.match(TEZ_MSG_SIGN_PATTERN)) {
      preview = value.string;
    } else {
      if (parsed.length > 0) {
        preview = parsed;
      } else {
        const parsed = await localForger.parse(req.payload);
        if (parsed.contents.length > 0) {
          preview = parsed;
        }
      }
    }
  } catch {
    preview = null;
  }

  await requestConfirm({
    id,
    payload: {
      type: 'sign',
      origin,
      networkRpc,
      appMeta: dApp.appMeta,
      sourcePkh: req.sourcePkh,
      payload: req.payload,
      preview
    },
    onDecline: () => {
      reject(new Error(TempleDAppErrorType.NotGranted));
    },
    handleIntercomRequest: async (confirmReq, decline) => {
      if (confirmReq?.type === TempleMessageType.DAppSignConfirmationRequest && confirmReq?.id === id) {
        if (confirmReq.confirmed) {
          const { prefixSig: signature } = await withUnlocked(({ vault }) => vault.sign(dApp.pkh, req.payload));
          resolve({
            type: TempleDAppMessageType.SignResponse,
            signature
          });
        } else {
          decline();
        }

        return {
          type: TempleMessageType.DAppSignConfirmationResponse
        };
      }
      return undefined;
    }
  });
};

export async function requestBroadcast(origin: string, req: TempleDAppRequest): Promise<TempleDAppBroadcastResponse> {
  const v2 = req as TempleDAppBroadcastRequest;
  if (![v2?.signedOpBytes?.length > 0].every(Boolean)) {
    throw new Error(TempleDAppErrorType.InvalidParams);
  }

  const dApp = await getDApp(origin);

  if (!dApp) {
    throw new Error(TempleDAppErrorType.NotGranted);
  }

  try {
    const rpc = new RpcClient(await getNetworkRPC(dApp.network));
    const opHash = await rpc.injectOperation(v2.signedOpBytes);
    return {
      type: TempleDAppMessageType.BroadcastResponse,
      opHash
    };
  } catch (err: any) {
    throw err instanceof TezosOperationError
      ? (() => {
          err.message = TempleDAppErrorType.TezosOperation;
          return err;
        })()
      : new Error('Failed to broadcast');
  }
}

export async function getAllDApps() {
  const dAppsSessions: TempleDAppSessions = (await browser.storage.local.get([STORAGE_KEY]))[STORAGE_KEY] || {};
  return dAppsSessions;
}

async function getDApp(origin: string): Promise<TempleDAppSession | undefined> {
  return (await getAllDApps())[origin];
}

async function setDApp(origin: string, permissions: TempleDAppSession) {
  const current = await getAllDApps();
  const newDApps = { ...current, [origin]: permissions };
  await setDApps(newDApps);
  return newDApps;
}

export async function removeDApp(origin: string) {
  const { [origin]: permissionsToRemove, ...restDApps } = await getAllDApps();
  await setDApps(restDApps);
  await Beacon.removeDAppPublicKey(origin);
  return restDApps;
}

function setDApps(newDApps: TempleDAppSessions) {
  return browser.storage.local.set({ [STORAGE_KEY]: newDApps });
}

type RequestConfirmParams = {
  id: string;
  payload: TempleDAppPayload;
  onDecline: () => void;
  handleIntercomRequest: (req: TempleRequest, decline: () => void) => Promise<any>;
};

async function requestConfirm({ id, payload, onDecline, handleIntercomRequest }: RequestConfirmParams): Promise<void> {
  let closing = false;
  const close = async () => {
    if (closing) return;
    closing = true;

    try {
      stopTimeout();
      stopRequestListening();
      stopWinRemovedListening();

      await closeWindow();
    } catch (_err) {}
  };

  const declineAndClose = () => {
    onDecline();
    close();
  };

  let knownPort: Runtime.Port | undefined;
  const stopRequestListening = intercom.onRequest(async (req: TempleRequest, port) => {
    alert('stopRequestListening = intercom.onRequest');
    if (req?.type === TempleMessageType.DAppGetPayloadRequest && req.id === id) {
      knownPort = port;

      if (payload.type === 'confirm_operations') {
        const dryrunResult = await dryRunOpParams({
          opParams: payload.opParams,
          networkRpc: payload.networkRpc,
          sourcePkh: payload.sourcePkh,
          sourcePublicKey: payload.sourcePublicKey
        });
        if (dryrunResult) {
          payload = {
            ...payload,
            ...((dryrunResult && dryrunResult.result) ?? {}),
            ...(dryrunResult.error ? { error: dryrunResult } : {})
          };
        }
      }

      return {
        type: TempleMessageType.DAppGetPayloadResponse,
        payload
      };
    } else {
      if (knownPort !== port) return;

      alert('calling await handleIntercomRequest(req, onDecline)');
      const result = await handleIntercomRequest(req, onDecline);
      if (result) {
        close();
        return result;
      }
    }
  });

  let left = 0;
  let top = 0;
  try {
    const lastFocused = await browser.windows.getLastFocused();
    // Position window in top right corner of lastFocused window.

    top = Math.round(lastFocused.top! + lastFocused.height! / 2 - CONFIRM_WINDOW_HEIGHT / 2);
    left = Math.round(lastFocused.left! + lastFocused.width! / 2 - CONFIRM_WINDOW_WIDTH / 2);
  } catch (err) {
    alert(err);
    // The following properties are more than likely 0, due to being
    // opened from the background chrome process for the extension that
    // has no physical dimensions
    const { screenX, screenY, outerWidth, outerHeight } = window;
    top = Math.round(screenY + outerHeight / 2 - CONFIRM_WINDOW_HEIGHT / 2);
    left = Math.round(screenX + outerWidth / 2 - CONFIRM_WINDOW_WIDTH / 2);
  }

  const confirmWin = await browser.windows.create({
    type: 'popup',
    url: browser.runtime.getURL(`confirm.html#?id=${id}`),
    width: 500,
    height: 500
  });

  // Firefox currently ignores left/top for create, but it works for update
  if (confirmWin.id && confirmWin.left !== left && confirmWin.state !== 'fullscreen') {
    await browser.windows.update(confirmWin.id, { left, top });
  }

  const closeWindow = async () => {
    if (confirmWin.id) {
      const win = await browser.windows.get(confirmWin.id);
      if (win.id) {
        await browser.windows.remove(win.id);
      }
    }
  };

  const handleWinRemoved = (winId: number) => {
    if (winId === confirmWin?.id) {
      declineAndClose();
    }
  };
  browser.windows.onRemoved.addListener(handleWinRemoved);
  const stopWinRemovedListening = () => browser.windows.onRemoved.removeListener(handleWinRemoved);

  // Decline after timeout
  const t = setTimeout(declineAndClose, AUTODECLINE_AFTER);
  const stopTimeout = () => clearTimeout(t);
}

async function getNetworkRPC(net: TempleDAppNetwork) {
  const targetRpc =
    typeof net === 'string' ? NETWORKS.find(n => n.id === net)!.rpcBaseURL : removeLastSlash(net.rpcUrl);

  if (typeof net === 'string') {
    try {
      const current = await getCurrentTempleNetwork();
      const [currentChainId, targetChainId] = await Promise.all([
        loadChainId(current.rpcBaseURL),
        loadChainId(targetRpc).catch(() => null)
      ]);

      return targetChainId === null || currentChainId === targetChainId ? current.rpcBaseURL : targetRpc;
    } catch {
      return targetRpc;
    }
  } else {
    return targetRpc;
  }
}

async function getCurrentTempleNetwork() {
  const { network_id: networkId, custom_networks_snapshot: customNetworksSnapshot } = await browser.storage.local.get([
    'network_id',
    'custom_networks_snapshot'
  ]);

  return [...NETWORKS, ...(customNetworksSnapshot ?? [])].find(n => n.id === networkId) ?? NETWORKS[0];
}

function isAllowedNetwork(net: TempleDAppNetwork) {
  return typeof net === 'string' ? NETWORKS.some(n => !n.disabled && n.id === net) : Boolean(net?.rpcUrl);
}

/*
function isNetworkEquals(fNet: TempleDAppNetwork, sNet: TempleDAppNetwork) {
  return typeof fNet !== 'string' && typeof sNet !== 'string'
    ? fNet.rpcUrl !== undefined && sNet.rpcUrl !== undefined
      ? removeLastSlash(fNet.rpcUrl) === removeLastSlash(sNet.rpcUrl)
      : false
    : fNet === sNet;
}*/

function removeLastSlash(str: string) {
  return str.endsWith('/') ? str.slice(0, -1) : str;
}

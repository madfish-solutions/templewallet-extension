import { localForger } from '@taquito/local-forging';
import { valueDecoder } from '@taquito/local-forging/dist/lib/michelson/codec';
import { Uint8ArrayConsumer } from '@taquito/local-forging/dist/lib/uint8array-consumer';
import { emitMicheline } from '@taquito/michel-codec';
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
  TempleDAppNetwork as TezosDAppNetwork
} from '@temple-wallet/dapp/dist/types';
import { capitalize } from 'lodash';
import { nanoid } from 'nanoid';
import { v4 as uuid } from 'uuid';

import {
  TezosDAppSession,
  getDApp as genericGetDApp,
  setDApp as genericSetDApp,
  getAllDApps as genericGetAllDApps,
  removeDApps as genericRemoveDApps
} from 'app/storage/dapps';
import { CUSTOM_TEZOS_NETWORKS_STORAGE_KEY, TEZOS_CHAINS_SPECS_STORAGE_KEY } from 'lib/constants';
import { fetchFromStorage } from 'lib/storage';
import { addLocalOperation } from 'lib/temple/activity';
import * as Beacon from 'lib/temple/beacon';
import { TezosChainSpecs } from 'lib/temple/chains-specs';
import { buildFinalTezosOpParams } from 'lib/temple/helpers';
import {
  TempleMessageType,
  TempleRequest,
  TempleNotification,
  TEZOS_MAINNET_CHAIN_ID,
  TempleTezosChainId,
  TempleTezosDAppPayload
} from 'lib/temple/types';
import { isValidTezosAddress } from 'lib/tezos';
import { isTruthy } from 'lib/utils';
import { StoredTezosNetwork, TEZOS_DEFAULT_NETWORKS, TezosNetworkEssentials } from 'temple/networks';
import { getTezosRpcClient, loadTezosChainId } from 'temple/tezos';
import { TempleChainKind } from 'temple/types';

import { intercom } from './defaults';
import { dryRunOpParams } from './dryrun';
import { RequestConfirmParams, requestConfirm as genericRequestConfirm } from './request-confirm';
import { withUnlocked } from './store';
import { Vault } from './vault';

const HEX_PATTERN = /^[0-9a-fA-F]+$/;
const TEZ_MSG_SIGN_PATTERN = /^0501[a-f0-9]{8}54657a6f73205369676e6564204d6573736167653a20[a-f0-9]*$/;

export async function getCurrentPermission(origin: string): Promise<TempleDAppGetCurrentPermissionResponse> {
  const dApp = await getDApp(origin);
  const permission = dApp
    ? {
        rpc: (await getAssertNetwork(dApp.network)).rpcBaseURL,
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
  req: TempleDAppPermissionRequest
): Promise<TempleDAppPermissionResponse> {
  if (typeof req?.appMeta?.name !== 'string') throw new Error(TempleDAppErrorType.InvalidParams);

  const network = await getAssertNetwork(req.network, TempleDAppErrorType.InvalidParams);

  const dApp = await getDApp(origin);

  if (!req.force && dApp && isNetworkEquals(req.network, dApp.network) && req.appMeta.name === dApp.appMeta.name) {
    return {
      type: TempleDAppMessageType.PermissionResponse,
      rpc: network.rpcBaseURL,
      pkh: dApp.pkh,
      publicKey: dApp.publicKey
    };
  }

  return new Promise(async (resolve, reject) => {
    const id = nanoid();

    await requestConfirm({
      id,
      payload: {
        type: 'connect',
        origin,
        network,
        appMeta: req.appMeta
      },
      onDecline: () => {
        reject(new Error(TempleDAppErrorType.NotGranted));
      },
      handleIntercomRequest: async (confirmReq, decline) => {
        if (confirmReq?.type === TempleMessageType.DAppPermConfirmationRequest && confirmReq?.id === id) {
          const { confirmed, accountPublicKeyHash, accountPublicKey } = confirmReq;
          if (confirmed && accountPublicKeyHash && accountPublicKey) {
            await setDApp(origin, {
              network: req.network,
              appMeta: req.appMeta,
              pkh: accountPublicKeyHash,
              publicKey: accountPublicKey
            });
            resolve({
              type: TempleDAppMessageType.PermissionResponse,
              pkh: accountPublicKeyHash,
              publicKey: accountPublicKey,
              rpc: network.rpcBaseURL
            });
            const broadcastMsg: TempleNotification = {
              type: TempleMessageType.SelectedAccountChanged,
              accountPublicKeyHash
            };
            intercom.broadcast(broadcastMsg);
          } else {
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

export async function requestOperation(
  origin: string,
  req: TempleDAppOperationRequest
): Promise<TempleDAppOperationResponse> {
  if (
    ![
      isValidTezosAddress(req?.sourcePkh),
      req?.opParams?.length > 0,
      req?.opParams?.every(op => typeof op.kind === 'string')
    ].every(Boolean)
  ) {
    throw new Error(TempleDAppErrorType.InvalidParams);
  }

  const dApp = await getDApp(origin);

  if (!dApp) {
    throw new Error(TempleDAppErrorType.NotGranted);
  }

  if (req.sourcePkh !== dApp.pkh) {
    throw new Error(TempleDAppErrorType.NotFound);
  }

  return new Promise(async (resolve, reject) => {
    const id = nanoid();
    const network = await getAssertNetwork(dApp.network);

    await requestConfirm({
      id,
      payload: {
        type: 'confirm_operations',
        origin,
        network,
        appMeta: dApp.appMeta,
        sourcePkh: req.sourcePkh,
        sourcePublicKey: dApp.publicKey,
        opParams: req.opParams
      },
      onDecline: () => {
        reject(new Error(TempleDAppErrorType.NotGranted));
      },
      handleIntercomRequest: (confirmReq, decline) =>
        handleIntercomRequest(confirmReq, decline, id, dApp, network, req, resolve, reject)
    });
  });
}

const handleIntercomRequest = async (
  confirmReq: TempleRequest,
  decline: () => void,
  id: string,
  dApp: TezosDAppSession,
  network: TezosNetworkEssentials,
  req: TempleDAppOperationRequest,
  resolve: any,
  reject: any
) => {
  if (confirmReq?.type === TempleMessageType.DAppTezosOpsConfirmationRequest && confirmReq?.id === id) {
    const { modifiedStorageLimit, modifiedTotalFee, confirmed } = confirmReq;
    if (confirmed) {
      try {
        const op = await withUnlocked(({ vault }) =>
          vault.sendOperations(
            dApp.pkh,
            network,
            buildFinalTezosOpParams(req.opParams, modifiedTotalFee, modifiedStorageLimit)
          )
        );

        safeGetChain(network.rpcBaseURL, op);

        resolve({
          type: TempleDAppMessageType.OperationResponse,
          opHash: op.hash
        });
      } catch (err: any) {
        if (err instanceof TezosOperationError) {
          err.message = TempleDAppErrorType.TezosOperation;
          reject(err);
        } else {
          throw err;
        }
      }
    } else {
      decline();
    }

    return {
      type: TempleMessageType.DAppOpsConfirmationResponse
    };
  }
  return undefined;
};

const safeGetChain = async (networkRpc: string, op: any) => {
  try {
    const chainId = await loadTezosChainId(networkRpc);
    await addLocalOperation(chainId, op.hash, op.results);
  } catch {}
};

export async function requestSign(origin: string, req: TempleDAppSignRequest): Promise<TempleDAppSignResponse> {
  if (req?.payload?.startsWith('0x')) {
    req = { ...req, payload: req.payload.substring(2) };
  }

  if (![isValidTezosAddress(req?.sourcePkh), HEX_PATTERN.test(req?.payload)].every(Boolean)) {
    throw new Error(TempleDAppErrorType.InvalidParams);
  }

  const dApp = await getDApp(origin);

  if (!dApp) {
    throw new Error(TempleDAppErrorType.NotGranted);
  }

  if (req.sourcePkh !== dApp.pkh) {
    throw new Error(TempleDAppErrorType.NotFound);
  }

  return new Promise((resolve, reject) => generatePromisifySign(resolve, reject, dApp, req));
}

const OPERATION_SIGN_PAYLOAD_PREFIX = '03';

const generatePromisifySign = async (resolve: any, reject: any, dApp: TezosDAppSession, req: TempleDAppSignRequest) => {
  const id = nanoid();
  const network = await getAssertNetwork(dApp.network);

  let preview: any;
  try {
    if (req.payload.startsWith(OPERATION_SIGN_PAYLOAD_PREFIX)) {
      const parsed = await localForger.parse(req.payload.slice(2));
      if (parsed.contents.length > 0) {
        preview = parsed;
      }
    } else {
      const value = valueDecoder(Uint8ArrayConsumer.fromHexString(req.payload.slice(2)));
      const parsed = emitMicheline(value, {
        indent: '  ',
        newline: '\n'
      }).slice(1, -1);

      if (req.payload.match(TEZ_MSG_SIGN_PATTERN)) {
        preview = value.string;
      } else if (parsed.length > 0) {
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
      network,
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

export async function requestBroadcast(
  origin: string,
  req: TempleDAppBroadcastRequest
): Promise<TempleDAppBroadcastResponse> {
  if (![req?.signedOpBytes?.length > 0].every(Boolean)) {
    throw new Error(TempleDAppErrorType.InvalidParams);
  }

  const dApp = await getDApp(origin);

  if (!dApp) {
    throw new Error(TempleDAppErrorType.NotGranted);
  }

  try {
    const rpc = getTezosRpcClient(await getAssertNetwork(dApp.network));
    const opHash = await rpc.injectOperation(req.signedOpBytes);
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

async function getDApp(origin: string) {
  return genericGetDApp(TempleChainKind.Tezos, origin);
}

async function getAllDApps() {
  return genericGetAllDApps(TempleChainKind.Tezos);
}

async function setDApp(origin: string, permissions: TezosDAppSession) {
  return genericSetDApp(TempleChainKind.Tezos, origin, permissions);
}

export async function removeDApps(origins: string[]) {
  const result = await genericRemoveDApps(TempleChainKind.Tezos, origins);
  const messageBeforeEncryption = Beacon.encodeMessage({
    id: uuid(),
    version: '4',
    senderId: await Beacon.getSenderId(),
    type: 'disconnect'
  });
  const encryptionResults = await Promise.allSettled(
    origins.map(async (origin): Promise<[string, string]> => {
      const pubKey = await Beacon.getDAppPublicKey(origin);

      if (!pubKey) {
        throw new Error('DApp public key not found.');
      }

      return [origin, await Beacon.encryptMessage(messageBeforeEncryption, pubKey)];
    })
  );
  await Beacon.removeDAppPublicKey(origins);
  const messagePayloads = Object.fromEntries(
    encryptionResults
      .filter((r): r is PromiseFulfilledResult<[string, string]> => r.status === 'fulfilled')
      .map(r => r.value)
  );
  intercom.broadcast({
    type: TempleMessageType.TempleTezosDAppsDisconnected,
    messagePayloads
  });

  return result;
}

export async function switchTezosAccount(origin: string, account: string, publicKey: string) {
  const dApp = await getDApp(origin);

  if (!dApp) {
    throw new Error(`Could not find dApp for origin ${origin}`);
  }

  const rpcUrl = await getNetworkRPC(dApp.network);
  const messageBeforeEncryption = Beacon.encodeMessage({
    id: uuid(),
    version: '4',
    senderId: await Beacon.getSenderId(),
    type: 'change_account_request',
    address: account,
    walletType: 'implicit',
    publicKey,
    network: {
      type: typeof dApp.network === 'string' ? dApp.network : 'custom',
      name: typeof dApp.network === 'string' ? capitalize(dApp.network) : dApp.network.name,
      rpcUrl: rpcUrl ?? undefined
    },
    scopes: [Beacon.PermissionScope.OPERATION_REQUEST, Beacon.PermissionScope.SIGN]
  });
  const pubKey = await Beacon.getDAppPublicKey(origin);

  if (!pubKey) {
    throw new Error('DApp public key not found.');
  }

  await setDApp(origin, { ...dApp, pkh: account, publicKey });

  intercom.broadcast({
    type: TempleMessageType.TempleTezosAccountSwitched,
    messagePayload: await Beacon.encryptMessage(messageBeforeEncryption, pubKey),
    origin
  });

  // TODO: implement checking that a dApp accepted the new account when dApps become ready to handle account switching
}

async function requestConfirm(params: Omit<RequestConfirmParams<TempleTezosDAppPayload>, 'transformPayload'>) {
  return genericRequestConfirm({
    ...params,
    transformPayload: async payload => {
      if (payload.type === 'confirm_operations') {
        const dryrunResult = await dryRunOpParams({
          opParams: payload.opParams,
          network: payload.network,
          sourcePkh: payload.sourcePkh,
          sourcePublicKey: payload.sourcePublicKey
        });
        if (dryrunResult) {
          const newPayload = { ...payload };

          if (dryrunResult.error) {
            newPayload.error = dryrunResult;
          }
          if (dryrunResult.result) {
            newPayload.estimates = dryrunResult.result.estimates;
          }

          return newPayload;
        }
      }
      return payload;
    }
  });
}

const dAppNetworksChainIds = {
  mainnet: TEZOS_MAINNET_CHAIN_ID,
  ghostnet: TempleTezosChainId.Ghostnet,
  shadownet: TempleTezosChainId.Shadownet,
  rionet: TempleTezosChainId.Rio,
  seoulnet: TempleTezosChainId.Seoul
};
async function getNetworkRPC(net: TezosDAppNetwork) {
  if (net === 'sandbox') {
    return 'http://localhost:8732';
  }

  if (typeof net === 'object') {
    return removeLastSlash(net.rpc);
  }

  if (net in dAppNetworksChainIds) {
    return await getActiveTempleRpcUrlByChainId(dAppNetworksChainIds[net as keyof typeof dAppNetworksChainIds]);
  }

  return null;
}

async function getAssertNetwork(net: TezosDAppNetwork, customErrorMessage?: string): Promise<TezosNetworkEssentials> {
  const rpcUrl = await getNetworkRPC(net);

  if (!rpcUrl) throw new Error(customErrorMessage ?? 'Unsupported network');

  const chainId = await loadTezosChainId(rpcUrl);

  return { rpcBaseURL: rpcUrl, chainId };
}

async function getActiveTempleRpcUrlByChainId(chainId: string): Promise<string | undefined> {
  const customTezosNetworks = await fetchFromStorage<StoredTezosNetwork[]>(CUSTOM_TEZOS_NETWORKS_STORAGE_KEY);
  const chainNetworks = (
    customTezosNetworks ? [...TEZOS_DEFAULT_NETWORKS, ...customTezosNetworks] : TEZOS_DEFAULT_NETWORKS
  ).filter(n => n.chainId === chainId);

  const tezosChainsSpecs = await fetchFromStorage<OptionalRecord<TezosChainSpecs>>(TEZOS_CHAINS_SPECS_STORAGE_KEY);
  const activeRpcId = tezosChainsSpecs?.[chainId]?.activeRpcId;

  const activeChainRpc = (activeRpcId && chainNetworks.find(n => n.id === activeRpcId)) || chainNetworks[0];

  return activeChainRpc?.rpcBaseURL;
}

function isNetworkEquals(fNet: TezosDAppNetwork, sNet: TezosDAppNetwork) {
  return typeof fNet !== 'string' && typeof sNet !== 'string'
    ? removeLastSlash(fNet.rpc) === removeLastSlash(sNet.rpc)
    : fNet === sNet;
}

function removeLastSlash(str: string) {
  return str.endsWith('/') ? str.slice(0, -1) : str;
}

export function init() {
  Vault.subscribeToRemoveAccounts(async addresses => {
    const removedAccounts = new Set(addresses.map(({ tezosAddress }) => tezosAddress).filter(isTruthy));
    const tezosDApps = await getAllDApps();
    const dAppsToRemoveOrigins: string[] = [];

    for (const [origin, dApp] of Object.entries(tezosDApps)) {
      if (removedAccounts.has(dApp.pkh)) {
        dAppsToRemoveOrigins.push(origin);
      }
    }

    if (dAppsToRemoveOrigins.length) {
      await removeDApps(dAppsToRemoveOrigins);
    }
  });
}

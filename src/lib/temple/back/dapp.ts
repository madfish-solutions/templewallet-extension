import { localForger } from "@taquito/local-forging";
import { valueDecoder } from "@taquito/local-forging/dist/lib/michelson/codec";
import { Uint8ArrayConsumer } from "@taquito/local-forging/dist/lib/uint8array-consumer";
import { emitMicheline } from "@taquito/michel-codec";
import { RpcClient } from "@taquito/rpc";
import { TezosOperationError } from "@taquito/taquito";
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
} from "@temple-wallet/dapp/dist/types";
import { nanoid } from "nanoid";
import { browser, Runtime } from "webextension-polyfill-ts";

import { intercom } from "lib/temple/back/defaults";
import {
  dryRunOpParams,
  increaseStorageOpParmas,
} from "lib/temple/back/dryrun";
import { withUnlocked } from "lib/temple/back/store";
import * as Beacon from "lib/temple/beacon";
import { loadChainId, isAddressValid } from "lib/temple/helpers";
import { NETWORKS } from "lib/temple/networks";
import * as PndOps from "lib/temple/pndops";
import {
  TempleMessageType,
  TempleRequest,
  TempleDAppPayload,
  TempleDAppSession,
  TempleDAppSessions,
  TempleDAppOperationsPayload,
} from "lib/temple/types";

const CONFIRM_WINDOW_WIDTH = 380;
const CONFIRM_WINDOW_HEIGHT = 632;
const AUTODECLINE_AFTER = 120_000;
const STORAGE_KEY = "dapp_sessions";
const HEX_PATTERN = /^[0-9a-fA-F]+$/;
const TEZ_MSG_SIGN_PATTERN = /^0501[a-f0-9]{8}54657a6f73205369676e6564204d6573736167653a20[a-f0-9]*$/;

export async function getCurrentPermission(
  origin: string
): Promise<TempleDAppGetCurrentPermissionResponse> {
  const dApp = await getDApp(origin);
  const permission = dApp
    ? {
        rpc: getNetworkRPC(dApp.network),
        pkh: dApp.pkh,
        publicKey: dApp.publicKey,
      }
    : null;
  return {
    type: TempleDAppMessageType.GetCurrentPermissionResponse,
    permission,
  };
}

export async function requestPermission(
  origin: string,
  req: TempleDAppPermissionRequest
): Promise<TempleDAppPermissionResponse> {
  if (
    ![
      isAllowedNetwork(req?.network),
      typeof req?.appMeta?.name === "string",
    ].every(Boolean)
  ) {
    throw new Error(TempleDAppErrorType.InvalidParams);
  }

  const networkRpc = getNetworkRPC(req.network);
  const dApp = await getDApp(origin);

  if (
    !req.force &&
    dApp &&
    isNetworkEquals(req.network, dApp.network) &&
    req.appMeta.name === dApp.appMeta.name
  ) {
    return {
      type: TempleDAppMessageType.PermissionResponse,
      rpc: networkRpc,
      pkh: dApp.pkh,
      publicKey: dApp.publicKey,
    };
  }

  return new Promise(async (resolve, reject) => {
    const id = nanoid();

    await requestConfirm({
      id,
      payload: {
        type: "connect",
        origin,
        networkRpc,
        appMeta: req.appMeta,
      },
      onDecline: () => {
        reject(new Error(TempleDAppErrorType.NotGranted));
      },
      handleIntercomRequest: async (confirmReq, decline) => {
        if (
          confirmReq?.type === TempleMessageType.DAppPermConfirmationRequest &&
          confirmReq?.id === id
        ) {
          const {
            confirmed,
            accountPublicKeyHash,
            accountPublicKey,
          } = confirmReq;
          if (confirmed && accountPublicKeyHash && accountPublicKey) {
            await setDApp(origin, {
              network: req.network,
              appMeta: req.appMeta,
              pkh: accountPublicKeyHash,
              publicKey: accountPublicKey,
            });
            resolve({
              type: TempleDAppMessageType.PermissionResponse,
              pkh: accountPublicKeyHash,
              publicKey: accountPublicKey,
              rpc: networkRpc,
            });
          } else {
            decline();
          }

          return {
            type: TempleMessageType.DAppPermConfirmationResponse,
          };
        }
        return;
      },
    });
  });
}

export async function requestOperation(
  origin: string,
  req: TempleDAppOperationRequest
): Promise<TempleDAppOperationResponse> {
  if (
    ![
      isAddressValid(req?.sourcePkh),
      req?.opParams?.length > 0,
      req?.opParams?.every((op) => typeof op.kind === "string"),
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
    const networkRpc = getNetworkRPC(dApp.network);

    await requestConfirm({
      id,
      payload: {
        type: "confirm_operations",
        origin,
        networkRpc,
        appMeta: dApp.appMeta,
        sourcePkh: req.sourcePkh,
        sourcePublicKey: dApp.publicKey,
        opParams: req.opParams,
      },
      onDecline: () => {
        reject(new Error(TempleDAppErrorType.NotGranted));
      },
      handleIntercomRequest: async (confirmReq, decline, finalPayload) => {
        if (
          confirmReq?.type === TempleMessageType.DAppOpsConfirmationRequest &&
          confirmReq?.id === id
        ) {
          if (confirmReq.confirmed) {
            try {
              const op = await withUnlocked(({ vault }) =>
                vault.sendOperations(
                  dApp.pkh,
                  networkRpc,
                  increaseStorageOpParmas(
                    req.opParams,
                    (finalPayload as TempleDAppOperationsPayload)?.estimates,
                    confirmReq.increaseStorageFee
                  )
                )
              );

              try {
                const chainId = await loadChainId(networkRpc);
                const pndOps = PndOps.fromOpResults(op.results, op.hash);
                await PndOps.append(dApp.pkh, chainId, pndOps);
              } catch {}

              resolve({
                type: TempleDAppMessageType.OperationResponse,
                opHash: op.hash,
              });
            } catch (err) {
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
            type: TempleMessageType.DAppOpsConfirmationResponse,
          };
        }
        return;
      },
    });
  });
}

export async function requestSign(
  origin: string,
  req: TempleDAppSignRequest
): Promise<TempleDAppSignResponse> {
  if (req?.payload?.startsWith("0x")) {
    req = { ...req, payload: req.payload.substring(2) };
  }

  if (
    ![isAddressValid(req?.sourcePkh), HEX_PATTERN.test(req?.payload)].every(
      Boolean
    )
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
    const networkRpc = getNetworkRPC(dApp.network);

    let preview: any;
    try {
      if (req.payload.match(TEZ_MSG_SIGN_PATTERN)) {
        preview = emitMicheline(
          valueDecoder(Uint8ArrayConsumer.fromHexString(req.payload.slice(2))),
          { indent: "  ", newline: "\n" }
        ).slice(1, -1);
      } else {
        const parsed = await localForger.parse(req.payload);
        if (parsed.contents.length > 0) {
          preview = parsed;
        }
      }
    } catch {
      preview = null;
    }

    await requestConfirm({
      id,
      payload: {
        type: "sign",
        origin,
        networkRpc,
        appMeta: dApp.appMeta,
        sourcePkh: req.sourcePkh,
        payload: req.payload,
        preview,
      },
      onDecline: () => {
        reject(new Error(TempleDAppErrorType.NotGranted));
      },
      handleIntercomRequest: async (confirmReq, decline) => {
        if (
          confirmReq?.type === TempleMessageType.DAppSignConfirmationRequest &&
          confirmReq?.id === id
        ) {
          if (confirmReq.confirmed) {
            const { prefixSig: signature } = await withUnlocked(({ vault }) =>
              vault.sign(dApp.pkh, req.payload)
            );
            resolve({
              type: TempleDAppMessageType.SignResponse,
              signature,
            });
          } else {
            decline();
          }

          return {
            type: TempleMessageType.DAppSignConfirmationResponse,
          };
        }
        return;
      },
    });
  });
}

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
    const rpc = new RpcClient(getNetworkRPC(dApp.network));
    const opHash = await rpc.injectOperation(req.signedOpBytes);
    return {
      type: TempleDAppMessageType.BroadcastResponse,
      opHash,
    };
  } catch (err) {
    throw err instanceof TezosOperationError
      ? (() => {
          err.message = TempleDAppErrorType.TezosOperation;
          return err;
        })()
      : new Error("Failed to broadcast");
  }
}

export async function getAllDApps() {
  const dAppsSessions: TempleDAppSessions =
    (await browser.storage.local.get([STORAGE_KEY]))[STORAGE_KEY] || {};
  return dAppsSessions;
}

export async function getDApp(
  origin: string
): Promise<TempleDAppSession | undefined> {
  return (await getAllDApps())[origin];
}

export async function setDApp(origin: string, permissions: TempleDAppSession) {
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

export function cleanDApps() {
  return setDApps({});
}

function setDApps(newDApps: TempleDAppSessions) {
  return browser.storage.local.set({ [STORAGE_KEY]: newDApps });
}

type RequestConfirmParams = {
  id: string;
  payload: TempleDAppPayload;
  onDecline: () => void;
  handleIntercomRequest: (
    req: TempleRequest,
    decline: () => void,
    finalPayload?: TempleDAppPayload
  ) => Promise<any>;
};

async function requestConfirm({
  id,
  payload,
  onDecline,
  handleIntercomRequest,
}: RequestConfirmParams) {
  const win = await browser.windows.getCurrent();
  const top = Math.round(
    win.top! + win.height! / 2 - CONFIRM_WINDOW_HEIGHT / 2
  );
  const left = Math.round(
    win.left! + win.width! / 2 - CONFIRM_WINDOW_WIDTH / 2
  );

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
  let finalPayload: TempleDAppPayload;
  const stopRequestListening = intercom.onRequest(
    async (req: TempleRequest, port) => {
      if (
        req?.type === TempleMessageType.DAppGetPayloadRequest &&
        req.id === id
      ) {
        knownPort = port;

        if (payload.type === "confirm_operations") {
          const dryrunResult = await dryRunOpParams({
            opParams: payload.opParams,
            networkRpc: payload.networkRpc,
            sourcePkh: payload.sourcePkh,
            sourcePublicKey: payload.sourcePublicKey,
          });
          payload = {
            ...payload,
            ...(dryrunResult ?? {}),
          };
          finalPayload = payload;
        }

        return {
          type: TempleMessageType.DAppGetPayloadResponse,
          payload,
        };
      } else {
        if (knownPort !== port) return;

        const result = await handleIntercomRequest(
          req,
          onDecline,
          finalPayload
        );
        if (result) {
          close();
          return result;
        }
      }
    }
  );

  const isWin = (await browser.runtime.getPlatformInfo()).os === "win";

  const confirmWin = await browser.windows.create({
    type: "popup",
    url: browser.runtime.getURL(`confirm.html#?id=${id}`),
    width: isWin ? CONFIRM_WINDOW_WIDTH + 16 : CONFIRM_WINDOW_WIDTH,
    height: isWin ? CONFIRM_WINDOW_HEIGHT + 17 : CONFIRM_WINDOW_HEIGHT,
    top: Math.max(top, 20),
    left: Math.max(left, 20),
  });

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
  const stopWinRemovedListening = () =>
    browser.windows.onRemoved.removeListener(handleWinRemoved);

  // Decline after timeout
  const t = setTimeout(declineAndClose, AUTODECLINE_AFTER);
  const stopTimeout = () => clearTimeout(t);
}

export function getNetworkRPC(net: TempleDAppNetwork) {
  return typeof net === "string"
    ? NETWORKS.find((n) => n.id === net)!.rpcBaseURL
    : net.rpc;
}

function isAllowedNetwork(net: TempleDAppNetwork) {
  return typeof net === "string"
    ? NETWORKS.some((n) => !n.disabled && n.id === net)
    : Boolean(net?.rpc);
}

function isNetworkEquals(fNet: TempleDAppNetwork, sNet: TempleDAppNetwork) {
  return typeof fNet !== "string" && typeof sNet !== "string"
    ? fNet?.rpc === sNet?.rpc
    : fNet === sNet;
}

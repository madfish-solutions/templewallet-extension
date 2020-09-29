import { browser, Runtime } from "webextension-polyfill-ts";
import { nanoid } from "nanoid";
import { RpcClient } from "@taquito/rpc";
import { localForger } from "@taquito/local-forging";
import {
  ThanosDAppMessageType,
  ThanosDAppErrorType,
  ThanosDAppPermissionRequest,
  ThanosDAppPermissionResponse,
  ThanosDAppOperationRequest,
  ThanosDAppOperationResponse,
  ThanosDAppSignRequest,
  ThanosDAppSignResponse,
  ThanosDAppBroadcastRequest,
  ThanosDAppBroadcastResponse,
  ThanosDAppNetwork,
} from "@thanos-wallet/dapp/dist/types";
import {
  ThanosMessageType,
  ThanosRequest,
  ThanosDAppPayload,
} from "lib/thanos/types";
import { intercom } from "lib/thanos/back/defaults";
import * as PndOps from "lib/thanos/back/pndops";
import { withUnlocked } from "lib/thanos/back/store";
import { NETWORKS } from "lib/thanos/networks";
import { loadChainId, isAddressValid } from "lib/thanos/helpers";

const CONFIRM_WINDOW_WIDTH = 380;
const CONFIRM_WINDOW_HEIGHT = 600;
const AUTODECLINE_AFTER = 120_000;

export async function requestPermission(
  origin: string,
  req: ThanosDAppPermissionRequest
): Promise<ThanosDAppPermissionResponse> {
  if (
    ![
      isAllowedNetwork(req?.network),
      typeof req?.appMeta?.name === "string",
    ].every(Boolean)
  ) {
    throw new Error(ThanosDAppErrorType.InvalidParams);
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
      type: ThanosDAppMessageType.PermissionResponse,
      pkh: dApp.pkh,
      publicKey: dApp.publicKey,
      rpc: networkRpc,
    } as any;
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
        reject(new Error(ThanosDAppErrorType.NotGranted));
      },
      handleIntercomRequest: async (confirmReq, decline) => {
        if (
          confirmReq?.type === ThanosMessageType.DAppPermConfirmationRequest &&
          confirmReq?.id === id
        ) {
          const {
            confirmed,
            accountPublicKeyHash,
            accountPublicKey,
          } = confirmReq;
          if (confirmed && accountPublicKeyHash && accountPublicKey) {
            await withUnlocked(async ({ vault }) => {
              vault.setDApp(origin, {
                network: req.network,
                appMeta: req.appMeta,
                pkh: accountPublicKeyHash,
                publicKey: accountPublicKey,
              });
            });
            resolve({
              type: ThanosDAppMessageType.PermissionResponse,
              pkh: accountPublicKeyHash,
              publicKey: accountPublicKey,
              rpc: networkRpc,
            } as any);
          } else {
            decline();
          }

          return {
            type: ThanosMessageType.DAppPermConfirmationResponse,
          };
        }
        return;
      },
    });
  });
}

export async function requestOperation(
  origin: string,
  req: ThanosDAppOperationRequest
): Promise<ThanosDAppOperationResponse> {
  if (
    ![
      isAddressValid(req?.sourcePkh),
      req?.opParams?.length > 0,
      req?.opParams?.every((op) => typeof op.kind === "string"),
    ].every(Boolean)
  ) {
    throw new Error(ThanosDAppErrorType.InvalidParams);
  }

  const dApp = await getDApp(origin);

  if (!dApp) {
    throw new Error(ThanosDAppErrorType.NotGranted);
  }

  if (req.sourcePkh !== dApp.pkh) {
    throw new Error(ThanosDAppErrorType.NotFound);
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
        opParams: req.opParams,
      },
      onDecline: () => {
        reject(new Error(ThanosDAppErrorType.NotGranted));
      },
      handleIntercomRequest: async (confirmReq, decline) => {
        if (
          confirmReq?.type === ThanosMessageType.DAppOpsConfirmationRequest &&
          confirmReq?.id === id
        ) {
          if (confirmReq.confirmed) {
            try {
              const op = await withUnlocked(({ vault }) =>
                vault.sendOperations(dApp.pkh, networkRpc, req.opParams)
              );

              try {
                const chainId = await loadChainId(networkRpc);
                const pndOps = PndOps.fromOpResults(op.results, op.hash);
                await PndOps.append(dApp.pkh, chainId, pndOps);
              } catch {}

              resolve({
                type: ThanosDAppMessageType.OperationResponse,
                opHash: op.hash,
              });
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

          return {
            type: ThanosMessageType.DAppOpsConfirmationResponse,
          };
        }
        return;
      },
    });
  });
}

export async function requestSign(
  origin: string,
  req: ThanosDAppSignRequest
): Promise<ThanosDAppSignResponse> {
  if (
    ![isAddressValid(req?.sourcePkh), req?.payload?.length > 0].every(Boolean)
  ) {
    throw new Error(ThanosDAppErrorType.InvalidParams);
  }

  const dApp = await getDApp(origin);

  if (!dApp) {
    throw new Error(ThanosDAppErrorType.NotGranted);
  }

  if (req.sourcePkh !== dApp.pkh) {
    throw new Error(ThanosDAppErrorType.NotFound);
  }

  return new Promise(async (resolve, reject) => {
    const id = nanoid();
    const networkRpc = getNetworkRPC(dApp.network);

    let preview: any;
    try {
      preview = await localForger.parse(req.payload);
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
        reject(new Error(ThanosDAppErrorType.NotGranted));
      },
      handleIntercomRequest: async (confirmReq, decline) => {
        if (
          confirmReq?.type === ThanosMessageType.DAppSignConfirmationRequest &&
          confirmReq?.id === id
        ) {
          if (confirmReq.confirmed) {
            try {
              const { sig: signature } = await withUnlocked(({ vault }) =>
                vault.sign(dApp.pkh, req.payload)
              );
              resolve({
                type: ThanosDAppMessageType.SignResponse,
                signature,
              });
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

          return {
            type: ThanosMessageType.DAppSignConfirmationResponse,
          };
        }
        return;
      },
    });
  });
}

export async function requestBroadcast(
  origin: string,
  req: ThanosDAppBroadcastRequest
): Promise<ThanosDAppBroadcastResponse> {
  if (![req?.signedOpBytes?.length > 0].every(Boolean)) {
    throw new Error(ThanosDAppErrorType.InvalidParams);
  }

  const dApp = await getDApp(origin);

  if (!dApp) {
    throw new Error(ThanosDAppErrorType.NotGranted);
  }

  try {
    const rpc = new RpcClient(getNetworkRPC(dApp.network));
    const opHash = await rpc.injectOperation(req.signedOpBytes);
    return {
      type: ThanosDAppMessageType.BroadcastResponse,
      opHash,
    };
  } catch (err) {
    throw new Error(`__tezos__${err.message}`);
  }
}

export function getDApp(origin: string) {
  return withUnlocked(({ vault }) => vault.getDApp(origin));
}

export function cleanDApps() {
  return withUnlocked(({ vault }) => vault.cleanDApps());
}

type RequestConfirmParams = {
  id: string;
  payload: ThanosDAppPayload;
  onDecline: () => void;
  handleIntercomRequest: (
    req: ThanosRequest,
    decline: () => void
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
  const stopRequestListening = intercom.onRequest(
    async (req: ThanosRequest, port) => {
      if (!knownPort) knownPort = port;
      if (knownPort !== port) return;

      if (
        req?.type === ThanosMessageType.DAppGetPayloadRequest &&
        req.id === id
      ) {
        return {
          type: ThanosMessageType.DAppGetPayloadResponse,
          payload,
        };
      } else {
        const result = await handleIntercomRequest(req, onDecline);
        if (result) {
          close();
          return result;
        }
      }
    }
  );

  const confirmWin = await browser.windows.create({
    type: "popup",
    url: browser.runtime.getURL(`confirm.html#?id=${id}`),
    width: CONFIRM_WINDOW_WIDTH,
    height: CONFIRM_WINDOW_HEIGHT,
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

export function getNetworkRPC(net: ThanosDAppNetwork) {
  return typeof net === "string"
    ? NETWORKS.find((n) => n.id === net)!.rpcBaseURL
    : net.rpc;
}

function isAllowedNetwork(net: ThanosDAppNetwork) {
  return typeof net === "string"
    ? NETWORKS.some((n) => !n.disabled && n.id === net)
    : Boolean(net?.rpc);
}

function isNetworkEquals(fNet: ThanosDAppNetwork, sNet: ThanosDAppNetwork) {
  return typeof fNet !== "string" && typeof sNet !== "string"
    ? fNet?.rpc === sNet?.rpc
    : fNet === sNet;
}

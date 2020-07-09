import { browser } from "webextension-polyfill-ts";
import { nanoid } from "nanoid";
import {
  ThanosDAppMessageType,
  ThanosDAppErrorType,
  ThanosDAppPermissionRequest,
  ThanosDAppPermissionResponse,
  ThanosDAppOperationRequest,
  ThanosDAppOperationResponse,
  ThanosDAppNetwork,
  ThanosDAppMetadata,
} from "@thanos-wallet/dapp/dist/types";
import { IntercomServer } from "lib/intercom/server";
import { Vault } from "lib/thanos/back/vault";
import { NETWORKS } from "lib/thanos/networks";
import { isAddressValid } from "lib/thanos/helpers";
import { ThanosMessageType, ThanosRequest } from "lib/thanos/types";

const CONFIRM_WINDOW_WIDTH = 380;
const CONFIRM_WINDOW_HEIGHT = 600;
const AUTODECLINE_AFTER = 120_000;

interface DAppPermission {
  network: ThanosDAppNetwork;
  appMeta: ThanosDAppMetadata;
  pkh: string;
}

const dApps = new Map<string, DAppPermission>();

export async function requestPermission(
  origin: string,
  req: ThanosDAppPermissionRequest,
  intercom: IntercomServer
): Promise<ThanosDAppPermissionResponse> {
  if (
    ![
      isAllowedNetwork(req?.network),
      typeof req?.appMeta?.name === "string",
    ].every(Boolean)
  ) {
    throw new Error(ThanosDAppErrorType.InvalidParams);
  }

  if (!req.force && dApps.has(origin)) {
    const dApp = dApps.get(origin)!;
    if (
      req.network === dApp.network &&
      req.appMeta.name === dApp.appMeta.name
    ) {
      return {
        type: ThanosDAppMessageType.PermissionResponse,
        pkh: dApp.pkh,
        rpc: getNetworkRPC(req.network),
      };
    }
  }

  return new Promise(async (resolve, reject) => {
    const id = nanoid();
    const payload = JSON.stringify({
      type: "connect",
      origin,
      network: req.network,
      appMeta: req.appMeta,
    });

    await requestConfirm({
      id,
      payload,
      intercom,
      onDecline: () => {
        reject(new Error(ThanosDAppErrorType.NotGranted));
      },
      handleIntercomRequest: async (confirmReq, decline) => {
        if (
          confirmReq?.type === ThanosMessageType.DAppPermissionConfirmRequest &&
          confirmReq?.id === id
        ) {
          if (confirmReq.confirm && confirmReq.pkh) {
            dApps.set(origin, {
              network: req.network,
              appMeta: req.appMeta,
              pkh: confirmReq.pkh,
            });
            resolve({
              type: ThanosDAppMessageType.PermissionResponse,
              pkh: confirmReq.pkh,
              rpc: getNetworkRPC(req.network),
              publicKey: confirmReq.publicKey,
            } as any);
          } else {
            decline();
          }

          return {
            type: ThanosMessageType.DAppPermissionConfirmResponse,
            id,
          };
        }
      },
    });
  });
}

export async function requestOperation(
  origin: string,
  req: ThanosDAppOperationRequest,
  intercom: IntercomServer
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

  if (!dApps.has(origin)) {
    throw new Error(ThanosDAppErrorType.NotGranted);
  }

  const dApp = dApps.get(origin)!;
  if (req.sourcePkh !== dApp.pkh) {
    throw new Error(ThanosDAppErrorType.NotFound);
  }

  return new Promise(async (resolve, reject) => {
    const id = nanoid();
    const payload = JSON.stringify({
      type: "confirm_operations",
      origin,
      network: dApp.network,
      appMeta: dApp.appMeta,
      sourcePkh: req.sourcePkh,
      opParams: req.opParams,
    });

    await requestConfirm({
      id,
      payload,
      intercom,
      onDecline: () => {
        reject(new Error(ThanosDAppErrorType.NotGranted));
      },
      handleIntercomRequest: async (confirmReq, decline) => {
        if (
          confirmReq?.type === ThanosMessageType.DAppOperationConfirmRequest &&
          confirmReq?.id === id
        ) {
          if (confirmReq.confirm && confirmReq.password) {
            const rpcUrl = getNetworkRPC(dApp.network);

            try {
              const opHash = await Vault.sendOperations(
                dApp.pkh,
                rpcUrl,
                confirmReq.password,
                req.opParams
              );
              resolve({
                type: ThanosDAppMessageType.OperationResponse,
                opHash,
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
            type: ThanosMessageType.DAppOperationConfirmResponse,
            id,
          };
        }
      },
    });
  });
}

type RequestConfirmParams = {
  id: string;
  payload: string;
  intercom: IntercomServer;
  onDecline: () => void;
  handleIntercomRequest: (
    req: ThanosRequest,
    decline: () => void
  ) => Promise<any>;
};

async function requestConfirm({
  id,
  intercom,
  payload,
  onDecline,
  handleIntercomRequest,
}: RequestConfirmParams) {
  const search = new URLSearchParams({
    id,
    payload,
  });
  const win = await browser.windows.getCurrent();
  const top = Math.round(
    win.top! + win.height! / 2 - CONFIRM_WINDOW_HEIGHT / 2
  );
  const left = Math.round(
    win.left! + win.width! / 2 - CONFIRM_WINDOW_WIDTH / 2
  );
  const confirmWin = await browser.windows.create({
    type: "popup",
    url: browser.runtime.getURL(`confirm.html#?${search}`),
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

  let stop: any;
  let timeout: any;
  let closing = false;
  const close = async () => {
    if (closing) return;
    closing = true;
    try {
      if (stop) stop();
      if (timeout) clearTimeout(timeout);
      await closeWindow();
    } catch (_err) {}
  };

  const decline = onDecline;
  stop = intercom.onRequest(async (req: ThanosRequest) => {
    const result = await handleIntercomRequest(req, decline);
    if (result) {
      close();
      return result;
    }
  });

  browser.windows.onRemoved.addListener((winId) => {
    if (winId === confirmWin?.id) {
      decline();
      close();
    }
  });
  // Decline after timeout
  timeout = setTimeout(() => {
    decline();
    close();
  }, AUTODECLINE_AFTER);
}

export function getNetworkRPC(id: string) {
  return NETWORKS.find((net) => net.id === id)!.rpcBaseURL;
}

function isAllowedNetwork(id: string) {
  return NETWORKS.some((net) => !net.disabled && net.id === id);
}

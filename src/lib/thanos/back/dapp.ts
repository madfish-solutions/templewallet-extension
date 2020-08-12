import { browser, Runtime } from "webextension-polyfill-ts";
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
import {
  ThanosMessageType,
  ThanosRequest,
  ThanosDAppPayload,
} from "lib/thanos/types";
import { intercom } from "lib/thanos/back/intercom";
import { withUnlocked } from "lib/thanos/back/store";
import { NETWORKS } from "lib/thanos/networks";
import { isAddressValid } from "lib/thanos/helpers";

const CONFIRM_WINDOW_WIDTH = 380;
const CONFIRM_WINDOW_HEIGHT = 600;
const AUTODECLINE_AFTER = 120_000;

interface DAppPermission {
  network: ThanosDAppNetwork;
  appMeta: ThanosDAppMetadata;
  pkh: string;
  publicKey?: string;
}

const dApps = new Map<string, DAppPermission>();

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

  if (!req.force && dApps.has(origin)) {
    const dApp = dApps.get(origin)!;
    if (
      req.network === dApp.network &&
      req.appMeta.name === dApp.appMeta.name
    ) {
      return {
        type: ThanosDAppMessageType.PermissionResponse,
        pkh: dApp.pkh,
        publicKey: dApp.publicKey,
        rpc: getNetworkRPC(req.network),
      } as any;
    }
  }

  return new Promise(async (resolve, reject) => {
    const id = nanoid();

    await requestConfirm({
      id,
      payload: {
        type: "connect",
        origin,
        network: req.network,
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
            dApps.set(origin, {
              network: req.network,
              appMeta: req.appMeta,
              pkh: accountPublicKeyHash,
              publicKey: accountPublicKey,
            });
            resolve({
              type: ThanosDAppMessageType.PermissionResponse,
              pkh: accountPublicKeyHash,
              publicKey: accountPublicKey,
              rpc: getNetworkRPC(req.network),
            } as any);
          } else {
            decline();
          }

          return {
            type: ThanosMessageType.DAppPermConfirmationResponse,
          };
        }
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

  if (!dApps.has(origin)) {
    throw new Error(ThanosDAppErrorType.NotGranted);
  }

  const dApp = dApps.get(origin)!;
  if (req.sourcePkh !== dApp.pkh) {
    throw new Error(ThanosDAppErrorType.NotFound);
  }

  return new Promise(async (resolve, reject) => {
    const id = nanoid();

    await requestConfirm({
      id,
      payload: {
        type: "confirm_operations",
        origin,
        network: dApp.network,
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
            const rpcUrl = getNetworkRPC(dApp.network);

            try {
              const op = await withUnlocked(({ vault }) =>
                vault.sendOperations(dApp.pkh, rpcUrl, req.opParams)
              );
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
      },
    });
  });
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
      if (
        !knownPort &&
        req?.type === ThanosMessageType.DAppGetPayloadRequest &&
        req.id === id
      ) {
        knownPort = port;
        return {
          type: ThanosMessageType.DAppGetPayloadResponse,
          payload,
        };
      } else if (port === knownPort) {
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

export function getNetworkRPC(id: string) {
  return NETWORKS.find((net) => net.id === id)!.rpcBaseURL;
}

function isAllowedNetwork(id: string) {
  return NETWORKS.some((net) => !net.disabled && net.id === id);
}

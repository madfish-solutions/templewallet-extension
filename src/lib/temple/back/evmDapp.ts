import { nanoid } from 'nanoid';
import browser, { Runtime } from 'webextension-polyfill';

import { TempleDAppPayload, TempleMessageType, TempleRequest } from '../types';
import { AUTODECLINE_AFTER, createConfirmationWindow } from './dapp';
import { intercom } from './defaults';
import { withUnlocked } from './store';

export const SEPOLIA_RPC_URL = 'https://ethereum-sepolia.publicnode.com';

type RequestConfirmParams = {
  id: string;
  payload: TempleDAppPayload;
  onDecline: () => void;
  handleIntercomRequest: (req: TempleRequest, decline: () => void) => Promise<any>;
};

export const requestConfirm = async ({ id, payload, onDecline, handleIntercomRequest }: RequestConfirmParams) => {
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
    if (req?.type === TempleMessageType.DAppGetPayloadRequest && req.id === id) {
      knownPort = port;

      return {
        type: TempleMessageType.DAppGetPayloadResponse,
        payload
      };
    } else {
      if (knownPort !== port) return;

      const result = await handleIntercomRequest(req, onDecline);
      if (result) {
        close();
        return result;
      }
    }
  });

  const confirmWin = await createConfirmationWindow(id);

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
};

export const connectEvm = async (origin: string) => {
  return new Promise(async (resolve, reject) => {
    const id = nanoid();

    await requestConfirm({
      id,
      payload: {
        type: 'connect_evm',
        origin,
        networkRpc: SEPOLIA_RPC_URL,
        appMeta: { name: origin.split('.')[1] }
      },
      onDecline: () => {
        const err = new Error('Connection declined');
        //@ts-ignore
        err.code = 4001;

        reject(err);
      },
      handleIntercomRequest: async (confirmReq, decline) => {
        if (confirmReq?.type === TempleMessageType.DAppPermConfirmationRequest && confirmReq?.id === id) {
          console.log('confirmReq', confirmReq);
          const { confirmed, accountPublicKeyHash } = confirmReq;
          if (confirmed && accountPublicKeyHash) {
            resolve([accountPublicKeyHash]);
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
};

export async function requestEvmOperation(origin: string, sourcePkh: string, opParams: any[]) {
  return new Promise(async (resolve, reject) => {
    const id = nanoid();
    console.log(opParams, 'ppppaarams');

    await requestConfirm({
      id,
      payload: {
        type: 'confirm_evm_operations',
        origin,
        sourcePkh,
        networkRpc: SEPOLIA_RPC_URL,
        appMeta: { name: origin.split('.')[1] },
        opParams
      },
      onDecline: () => {
        const err = new Error('Operation declined');
        //@ts-ignore
        err.code = 4001;
        reject(err);
      },
      handleIntercomRequest: async (confirmReq, decline) => {
        if (confirmReq?.type === TempleMessageType.DAppOpsConfirmationRequest && confirmReq?.id === id) {
          if (confirmReq.confirmed) {
            try {
              const op = await withUnlocked(({ vault }) =>
                vault.sendEvmDAppOperations(sourcePkh, SEPOLIA_RPC_URL, opParams)
              );

              resolve(op.hash);
            } catch (err) {
              console.error(err);
            }
          } else {
            decline();
          }

          return {
            type: TempleMessageType.DAppOpsConfirmationResponse
          };
        }
        return undefined;
      }
    });
  });
}

import { nanoid } from 'nanoid';
import browser, { Runtime } from 'webextension-polyfill';

import { TempleDAppPayload, TempleMessageType, TempleRequest } from '../types';
import { AUTODECLINE_AFTER, createConfirmationWindow } from './dapp';
import { intercom } from './defaults';
import { withUnlocked } from './store';

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

export const connectEvm = async (origin: string, chainId?: string) => {
  if (!chainId) return new Error('chainId is not defined');

  return new Promise(async (resolve, reject) => {
    const id = nanoid();

    await requestConfirm({
      id,
      payload: {
        type: 'connect_evm',
        origin,
        networkRpc: getRpcUrlByChainId(chainId),
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

export const switchChain = async (params: unknown[] | Record<string, unknown> | undefined) => {
  if (!params) return new Error('Request params is not defined');
  //@ts-ignore
  const chainIdHex = params[0].chainId;
  const rpcUrl = getRpcUrlByChainId(chainIdHex);

  return new Promise(async (resolve, reject) => {
    const id = nanoid();

    await requestConfirm({
      id,
      payload: {
        type: 'switch_evm_network',
        origin,
        networkRpc: rpcUrl,
        appMeta: { name: origin.split('.')[1] }
      },
      onDecline: () => {
        const err = new Error('Network switch declined');
        //@ts-ignore
        err.code = 4001;

        reject(err);
      },
      handleIntercomRequest: async (confirmReq, decline) => {
        if (confirmReq?.type === TempleMessageType.DAppPermConfirmationRequest && confirmReq?.id === id) {
          const { confirmed } = confirmReq;
          if (confirmed) {
            resolve({ chainId: chainIdHex, rpcUrl });
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

export async function requestEvmOperation(
  origin: string,
  sourcePkh: string | undefined,
  chainId: string | undefined,
  opParams: any[]
) {
  if (!sourcePkh) return new Error('sourcePkh is not defined');
  if (!chainId) return new Error('chainId is not defined');

  const rpcUrl = getRpcUrlByChainId(chainId);

  return new Promise(async (resolve, reject) => {
    const id = nanoid();

    await requestConfirm({
      id,
      payload: {
        type: 'confirm_evm_operations',
        origin,
        sourcePkh,
        networkRpc: rpcUrl,
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
              const op = await withUnlocked(({ vault }) => vault.sendEvmDAppOperations(sourcePkh, rpcUrl, opParams));

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

export async function requestEvmSign(
  origin: string,
  sourcePkh: string | undefined,
  chainId: string | undefined,
  opParams: any[]
) {
  if (!sourcePkh) return new Error('sourcePkh is not defined');
  if (!chainId) return new Error('chainId is not defined');

  const rpcUrl = getRpcUrlByChainId(chainId);

  return new Promise(async (resolve, reject) => {
    const id = nanoid();

    await requestConfirm({
      id,
      payload: {
        type: 'sign_evm',
        origin,
        sourcePkh,
        networkRpc: rpcUrl,
        appMeta: { name: origin.split('.')[1] },
        opParams
      },
      onDecline: () => {
        const err = new Error('Sign declined');
        //@ts-ignore
        err.code = 4001;
        reject(err);
      },
      handleIntercomRequest: async (confirmReq, decline) => {
        if (confirmReq?.type === TempleMessageType.DAppSignConfirmationRequest && confirmReq?.id === id) {
          if (confirmReq.confirmed) {
            const result = await withUnlocked(({ vault }) => vault.signEvm(sourcePkh, rpcUrl, opParams));
            resolve(result);
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
  });
}

const chainIdHexRpcUrlRecord: Record<string, string> = {
  '0xaa36a7': 'https://ethereum-sepolia.publicnode.com',
  '0x5': 'https://ethereum-goerli.publicnode.com',
  '0x13881': 'https://polygon-mumbai-bor.publicnode.com',
  '0x61': 'https://bsc-testnet.publicnode.com',
  '0xa869': 'https://avalanche-fuji-c-chain.publicnode.com',
  '0xfa2': 'https://fantom-testnet.publicnode.com'
};

function getRpcUrlByChainId(chainIdHex: string) {
  return chainIdHexRpcUrlRecord[chainIdHex] ?? chainIdHex;
}

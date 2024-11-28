import { nanoid } from 'nanoid';

import {
  EvmDAppSession,
  getDApp as genericGetDApp,
  setDApp as genericSetDApp,
  removeDApps as genericRemoveDApps
} from 'app/storage/dapps';
import { evmRpcMethodsNames, RETURNED_ACCOUNTS_CAVEAT_NAME } from 'temple/evm/constants';
import { getEvmChainsRpcUrls } from 'temple/evm/evm-chains-rpc-urls';
import { ChangePermissionsPayload, ErrorWithCode } from 'temple/evm/types';
import { TempleChainKind } from 'temple/types';

import {
  TempleEvmDAppPersonalSignPayload,
  TempleEvmDAppSignPayload,
  TempleEvmDAppSignTypedPayload,
  TempleMessageType
} from '../types';

import { requestConfirm as genericRequestConfirm, RequestConfirmParams } from './request-confirm';
import { withUnlocked } from './store';
import type { Vault } from './vault';

async function requestConfirm(params: Omit<RequestConfirmParams, 'transformPayload'>) {
  return genericRequestConfirm(params);
}

async function getDApp(origin: string) {
  return genericGetDApp(TempleChainKind.EVM, origin);
}

async function setDApp(origin: string, permissions: EvmDAppSession) {
  return genericSetDApp(TempleChainKind.EVM, origin, permissions);
}

async function removeDApps(origins: string[]) {
  return genericRemoveDApps(TempleChainKind.EVM, origins);
}

export const connectEvm = async (origin: string, chainId: string, icon?: string) => {
  return new Promise<{ accounts: HexString[]; rpcUrl: string }>(async (resolve, reject) => {
    const id = nanoid();
    const rpcUrl = (await getEvmChainsRpcUrls())[chainId];
    const appMeta = { name: new URL(origin).hostname, icon };

    if (!rpcUrl) {
      throw new ErrorWithCode(4001, 'Network not found');
    }

    await requestConfirm({
      id,
      payload: {
        type: 'connect',
        chainType: TempleChainKind.EVM,
        origin,
        chainId,
        appMeta
      },
      onDecline: () => {
        reject(new ErrorWithCode(4001, 'Connection declined'));
      },
      handleIntercomRequest: async (confirmReq, decline) => {
        if (confirmReq?.type === TempleMessageType.DAppPermConfirmationRequest && confirmReq?.id === id) {
          const { confirmed, accountPublicKeyHash } = confirmReq;
          if (confirmed && accountPublicKeyHash) {
            const pkh = accountPublicKeyHash as HexString;
            await setDApp(origin, {
              chainId: Number(chainId),
              appMeta,
              pkh,
              permissions: [
                {
                  caveats: [
                    {
                      type: RETURNED_ACCOUNTS_CAVEAT_NAME,
                      value: [pkh]
                    }
                  ],
                  date: Date.now(),
                  id: nanoid(),
                  invoker: origin as `http://${string}` | `https://${string}`,
                  parentCapability: evmRpcMethodsNames.eth_accounts
                }
              ]
            });
            resolve({ accounts: [pkh], rpcUrl });
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

export const switchChain = async (origin: string, destinationChainId: number) => {
  const rpcUrl = (await getEvmChainsRpcUrls())[destinationChainId];

  if (!rpcUrl) {
    throw new ErrorWithCode(4001, 'Network not found');
  }

  const dApp = await getDApp(origin);

  if (!dApp) {
    throw new Error('DApp not found');
  }

  await setDApp(origin, { ...dApp, chainId: destinationChainId });

  return { chainId: `0x${destinationChainId.toString(16)}`, rpcUrl };
};

const makeRequestEvmSignFunction =
  <T extends TempleEvmDAppSignPayload>(
    payloadType: T['type'],
    signDataWithValue: (vault: Vault, payload: T['payload'], signerPkh: HexString) => Promise<HexString>
  ) =>
  (origin: string, sourcePkh: HexString, chainId: string, payload: T['payload'], icon?: string) =>
    new Promise<HexString>(async (resolve, reject) => {
      const id = nanoid();

      await requestConfirm({
        id,
        payload: {
          chainType: TempleChainKind.EVM,
          type: payloadType,
          sourcePkh,
          payload,
          chainId,
          origin,
          appMeta: { name: new URL(origin).hostname, icon }
        } as T,
        onDecline: () => {
          reject(new ErrorWithCode(4001, 'Signature declined'));
        },
        handleIntercomRequest: async (confirmReq, decline) => {
          if (confirmReq?.type === TempleMessageType.DAppSignConfirmationRequest && confirmReq.id === id) {
            if (confirmReq.confirmed) {
              const result = await withUnlocked(({ vault }) => signDataWithValue(vault, payload, sourcePkh));
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

export const requestEvmTypedSign = makeRequestEvmSignFunction<TempleEvmDAppSignTypedPayload>(
  'sign_typed',
  (vault, typedData, signerPkh) => vault.signEvmTypedData(signerPkh, typedData)
);

export const requestEvmPersonalSign = makeRequestEvmSignFunction<TempleEvmDAppPersonalSignPayload>(
  'personal_sign',
  (vault, message, signerPkh) => vault.signEvmMessage(signerPkh, message)
);

export const getEvmPermissions = async (origin: string) => {
  const dApp = await getDApp(origin);

  return dApp?.permissions ?? [];
};

export const revokeEvmPermissions = async (origin: string, _payload: ChangePermissionsPayload) => {
  // TODO: add handling other permissions than for reading accounts
  return removeDApps([origin]);
};

export const requestEvmPermissions = async (
  origin: string,
  chainId: string,
  _payload: ChangePermissionsPayload,
  icon?: string
) => {
  // TODO: add handling other permissions than for reading accounts
  return connectEvm(origin, chainId, icon);
};

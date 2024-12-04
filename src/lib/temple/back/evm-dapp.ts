import { nanoid } from 'nanoid';
import { getAddress, toHex, WalletPermission } from 'viem';

import {
  EvmDAppSession,
  getDApp as genericGetDApp,
  setDApp as genericSetDApp,
  removeDApps as genericRemoveDApps
} from 'app/storage/dapps';
import { evmRpcMethodsNames, INVALID_PARAMS_CODE, RETURNED_ACCOUNTS_CAVEAT_NAME } from 'temple/evm/constants';
import { getEvmChainsRpcUrls } from 'temple/evm/evm-chains-rpc-urls';
import { ChangePermissionsPayload, ErrorWithCode } from 'temple/evm/types';
import { TempleChainKind } from 'temple/types';

import {
  ETHEREUM_MAINNET_CHAIN_ID,
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

function getAppMeta(origin: string, icon?: string) {
  return { name: new URL(origin).hostname, icon };
}

function makeReadAccountPermission(pkh: string): WalletPermission {
  return {
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
  };
}

export const getDefaultRpc = async (origin: string) => {
  const dApp = await getDApp(origin);
  const chainId = dApp?.chainId ?? ETHEREUM_MAINNET_CHAIN_ID;
  const rpcUrls = (await getEvmChainsRpcUrls())[chainId];

  return { chainId: toHex(chainId), rpcUrls, accounts: dApp?.pkh ? [dApp.pkh] : [] };
};

export const connectEvm = async (origin: string, chainId: string, icon?: string) => {
  return new Promise<{ accounts: HexString[]; rpcUrls: string[] }>(async (resolve, reject) => {
    const id = nanoid();
    const rpcUrls = (await getEvmChainsRpcUrls())[Number(chainId)];
    const appMeta = getAppMeta(origin, icon);

    if (!rpcUrls) {
      reject(new ErrorWithCode(4001, 'Network not found'));

      return;
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
            const pkh = accountPublicKeyHash.toLowerCase() as HexString;
            await setDApp(origin, {
              chainId: Number(chainId),
              appMeta,
              pkh,
              permissions: [makeReadAccountPermission(pkh)]
            });
            resolve({ accounts: [pkh], rpcUrls });
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
  const rpcUrls = (await getEvmChainsRpcUrls())[destinationChainId];

  if (!rpcUrls) {
    throw new ErrorWithCode(4001, 'Network not found');
  }

  const dApp = await getDApp(origin);

  if (!dApp) {
    throw new ErrorWithCode(4001, 'DApp not found');
  }

  await setDApp(origin, { ...dApp, chainId: destinationChainId });

  return { chainId: toHex(destinationChainId), rpcUrls };
};

const makeRequestEvmSignFunction =
  <T extends TempleEvmDAppSignPayload>(
    payloadType: T['type'],
    signDataWithValue: (
      vault: Vault,
      payload: T['payload'],
      signerPkh: HexString,
      connectedChainId: string
    ) => Promise<HexString>
  ) =>
  (origin: string, rawSourcePkh: HexString, chainId: string, payload: T['payload'], icon?: string) =>
    new Promise<HexString>(async (resolve, reject) => {
      const id = nanoid();
      const sourcePkh = getAddress(rawSourcePkh);

      const dApp = await getDApp(origin);

      if (!dApp) {
        reject(new ErrorWithCode(4001, 'DApp not found'));

        return;
      }

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
              const result = await withUnlocked(({ vault }) => signDataWithValue(vault, payload, sourcePkh, chainId));
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
  (vault, typedData, signerPkh, connectedChainId) => {
    if (
      !Array.isArray(typedData) &&
      typedData.domain?.chainId !== undefined &&
      typedData.domain?.chainId !== Number(connectedChainId)
    ) {
      throw new ErrorWithCode(INVALID_PARAMS_CODE, 'Cannot sign payload with other chain ID than the current one');
    }

    return vault.signEvmTypedData(signerPkh, typedData);
  }
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
  await removeDApps([origin]);

  return {};
};

export const requestEvmPermissions = async (
  origin: string,
  chainId: string,
  _payload: ChangePermissionsPayload,
  icon?: string
) => {
  // TODO: add handling other permissions than for reading accounts
  const { accounts, rpcUrls } = await connectEvm(origin, chainId, icon);

  return { permissions: [makeReadAccountPermission(accounts[0])], rpcUrls };
};

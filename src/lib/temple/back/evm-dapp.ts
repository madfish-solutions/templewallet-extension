import { nanoid } from 'nanoid';
import { getAddress, toHex, WalletPermission } from 'viem';
import browser, { Storage } from 'webextension-polyfill';

import {
  EvmDAppSession,
  getDApp as genericGetDApp,
  setDApp as genericSetDApp,
  removeDApps as genericRemoveDApps,
  getAllDApps
} from 'app/storage/dapps';
import { isTruthy } from 'lib/utils';
import { EVMErrorCodes, evmRpcMethodsNames, RETURNED_ACCOUNTS_CAVEAT_NAME } from 'temple/evm/constants';
import { ChainsRpcUrls, EVM_CHAINS_RPC_URLS_STORAGE_KEY, getEvmChainsRpcUrls } from 'temple/evm/evm-chains-rpc-urls';
import { ChangePermissionsPayload, ErrorWithCode } from 'temple/evm/types';
import { TempleChainKind } from 'temple/types';

import {
  ETHEREUM_MAINNET_CHAIN_ID,
  TempleEvmDAppPersonalSignPayload,
  TempleEvmDAppSignPayload,
  TempleEvmDAppSignTypedPayload,
  TempleMessageType
} from '../types';

import { intercom } from './defaults';
import { requestConfirm as genericRequestConfirm, RequestConfirmParams } from './request-confirm';
import { withUnlocked } from './store';
import { Vault } from './vault';

export async function init() {
  browser.storage.local.onChanged.addListener(
    evmRpcUrlsListener as unknown as SyncFn<Storage.StorageAreaOnChangedChangesType>
  );

  Vault.subscribeToRemoveAccounts(async addresses => {
    const removedAccounts = new Set(addresses.map(({ evmAddress }) => evmAddress).filter(isTruthy));
    const evmDApps = await getAllDApps(TempleChainKind.EVM);
    const dAppsToRemoveOrigins: string[] = [];

    for (const [origin, dApp] of Object.entries(evmDApps)) {
      if (removedAccounts.has(dApp.pkh)) {
        dAppsToRemoveOrigins.push(origin);
      }
    }

    if (dAppsToRemoveOrigins.length) {
      await removeDApps(dAppsToRemoveOrigins);
    }
  });
}

/** Implements a reaction on disabling a chain or removing it, or wallet reset */
async function evmRpcUrlsListener(changes: StringRecord<Storage.StorageChange>) {
  if (!(EVM_CHAINS_RPC_URLS_STORAGE_KEY in changes)) {
    return;
  }

  const { oldValue, newValue } = changes[EVM_CHAINS_RPC_URLS_STORAGE_KEY];

  const oldEvmRpcUrls: ChainsRpcUrls = oldValue ?? {};
  const newEvmRpcUrls: ChainsRpcUrls = newValue ?? {};
  const removedChainsIds = new Set<number>();
  for (const chainId in oldEvmRpcUrls) {
    const newChainRpcUrls = newEvmRpcUrls[chainId];
    if (!newChainRpcUrls || newChainRpcUrls.length === 0) {
      removedChainsIds.add(Number(chainId));
    }
  }

  if (removedChainsIds.size === 0) {
    return;
  }

  const evmDApps = await getAllDApps(TempleChainKind.EVM);
  const dAppsToRemoveOrigins: string[] = [];
  for (const [origin, dApp] of Object.entries(evmDApps)) {
    if (removedChainsIds.has(dApp.chainId)) {
      dAppsToRemoveOrigins.push(origin);
    }
  }

  if (dAppsToRemoveOrigins.length) {
    await removeDApps(dAppsToRemoveOrigins);
    await Promise.all(dAppsToRemoveOrigins.map(origin => switchChain(origin, ETHEREUM_MAINNET_CHAIN_ID, true)));
  }
}

async function requestConfirm(params: Omit<RequestConfirmParams, 'transformPayload'>) {
  return genericRequestConfirm(params);
}

async function getDApp(origin: string) {
  return genericGetDApp(TempleChainKind.EVM, origin);
}

async function setDApp(origin: string, permissions: EvmDAppSession) {
  return genericSetDApp(TempleChainKind.EVM, origin, permissions);
}

export async function removeDApps(origins: string[]) {
  const result = await genericRemoveDApps(TempleChainKind.EVM, origins);
  intercom.broadcast({
    type: TempleMessageType.TempleEvmDAppsDisconnected,
    origins
  });

  return result;
}

function getAppMeta(origin: string, icon?: string) {
  return { name: new URL(origin).hostname, icon };
}

function makeReadAccountPermission(pkh: string, origin: string): WalletPermission {
  return {
    caveats: [
      {
        type: RETURNED_ACCOUNTS_CAVEAT_NAME,
        value: [pkh]
      }
    ],
    date: Date.now(),
    id: nanoid(),
    invoker: origin as WalletPermission['invoker'],
    parentCapability: evmRpcMethodsNames.eth_accounts
  };
}

export const getDefaultRpc = async (origin: string) => {
  const dApp = await getDApp(origin);
  const chainId = dApp?.chainId ?? ETHEREUM_MAINNET_CHAIN_ID;
  const rpcUrls = (await getEvmChainsRpcUrls())[chainId];

  return { chainId: toHex(chainId), rpcUrls, accounts: dApp?.pkh ? [dApp.pkh.toLowerCase()] : [] };
};

export const connectEvm = async (origin: string, chainId: string, icon?: string) => {
  return new Promise<{ accounts: HexString[]; rpcUrls: string[] }>(async (resolve, reject) => {
    const id = nanoid();
    const rpcUrls = (await getEvmChainsRpcUrls())[Number(chainId)];
    const appMeta = getAppMeta(origin, icon);

    if (!rpcUrls) {
      // TODO: find a more appropriate error code
      reject(new ErrorWithCode(EVMErrorCodes.INVALID_PARAMS, 'Network not found'));

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
        reject(new ErrorWithCode(EVMErrorCodes.USER_REJECTED_REQUEST, 'Connection declined'));
      },
      handleIntercomRequest: async (confirmReq, decline) => {
        if (confirmReq?.type === TempleMessageType.DAppPermConfirmationRequest && confirmReq?.id === id) {
          const { confirmed, accountPublicKeyHash } = confirmReq;
          if (confirmed && accountPublicKeyHash) {
            const lowercasePkh = accountPublicKeyHash.toLowerCase() as HexString;
            await setDApp(origin, {
              chainId: Number(chainId),
              appMeta,
              pkh: accountPublicKeyHash,
              permissions: [makeReadAccountPermission(lowercasePkh, origin)]
            });
            resolve({ accounts: [lowercasePkh], rpcUrls });
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

export const switchChain = async (origin: string, destinationChainId: number, isInternal: boolean) => {
  const rpcUrls = (await getEvmChainsRpcUrls())[destinationChainId];

  if (!rpcUrls) {
    // TODO: find a more appropriate error code
    throw new ErrorWithCode(EVMErrorCodes.INVALID_PARAMS, 'Network not found');
  }

  const dApp = await getDApp(origin);

  if (dApp) {
    await setDApp(origin, { ...dApp, chainId: destinationChainId });
  }

  if (isInternal) {
    intercom.broadcast({
      type: TempleMessageType.TempleEvmChainSwitched,
      origin,
      chainId: destinationChainId,
      rpcUrls
    });
  }

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
        reject(new ErrorWithCode(EVMErrorCodes.NOT_AUTHORIZED, 'DApp not found'));

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
          reject(new ErrorWithCode(EVMErrorCodes.USER_REJECTED_REQUEST, 'Signature declined'));
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
      throw new ErrorWithCode(
        EVMErrorCodes.CHAIN_DISCONNECTED,
        'Cannot sign payload with other chain ID than the current one'
      );
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

  return { permissions: [makeReadAccountPermission(accounts[0], origin)], rpcUrls };
};

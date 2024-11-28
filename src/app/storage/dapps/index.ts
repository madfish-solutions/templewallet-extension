import type { TempleDAppMetadata, TempleDAppNetwork } from '@temple-wallet/dapp/dist/types';
import { WalletPermission } from 'viem';

import { fetchFromStorage, putToStorage } from 'lib/storage';
import * as Beacon from 'lib/temple/beacon';
import { TempleChainKind } from 'temple/types';

export const tezosDAppStorageKey = 'dapp_sessions';
const evmDAppStorageKey = 'evm_dapp_sessions';

export type TezosDAppNetwork = TempleDAppNetwork | 'ghostnet';

export interface TezosDAppSession {
  network: TezosDAppNetwork;
  appMeta: TempleDAppMetadata;
  pkh: string;
  publicKey: string;
}

export interface EvmDAppSession {
  chainId: number;
  appMeta: TempleDAppMetadata;
  pkh: string;
  permissions: WalletPermission[];
}

type DAppSession<T extends TempleChainKind> = T extends TempleChainKind.Tezos ? TezosDAppSession : EvmDAppSession;

type DAppsSessionsRecord<T extends TempleChainKind> = StringRecord<DAppSession<T>>;

export type TezosDAppsSessionsRecord = DAppsSessionsRecord<TempleChainKind.Tezos>;

// type EvmDAppsSessionsRecord = DAppsSessionsRecord<TempleChainKind.EVM>;

function getStoredDAppsSessions<T extends TempleChainKind>(chainKind: T): Promise<DAppsSessionsRecord<T> | null> {
  return fetchFromStorage(chainKind === TempleChainKind.Tezos ? tezosDAppStorageKey : evmDAppStorageKey);
}

function putStoredDappsSessions<T extends TempleChainKind>(chainKind: T, value: DAppsSessionsRecord<T>) {
  return putToStorage(chainKind === TempleChainKind.Tezos ? tezosDAppStorageKey : evmDAppStorageKey, value);
}

async function getAllDApps<T extends TempleChainKind>(chainKind: T) {
  return (await getStoredDAppsSessions(chainKind)) || {};
}

export async function getDApp<T extends TempleChainKind>(
  chainKind: T,
  origin: string
): Promise<DAppSession<T> | undefined> {
  const dApps = await getAllDApps<T>(chainKind);

  return dApps[origin];
}

export async function setDApp<T extends TempleChainKind>(
  chainKind: T,
  origin: string,
  session: DAppSession<T>
): Promise<DAppsSessionsRecord<T>> {
  const current = await getAllDApps(chainKind);
  const newDApps = { ...current, [origin]: session };
  await putStoredDappsSessions(chainKind, newDApps);

  return newDApps;
}

export async function removeDApps<T extends TempleChainKind>(chainKind: T, origins: string[]) {
  const dappsRecord = await getAllDApps(chainKind);
  for (const origin of origins) delete dappsRecord[origin];
  await putStoredDappsSessions(chainKind, dappsRecord);

  if (chainKind === TempleChainKind.Tezos) {
    await Beacon.removeDAppPublicKey(origins);
  }

  return dappsRecord;
}

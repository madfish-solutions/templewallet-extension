import { browser } from "webextension-polyfill-ts";

export interface PendingOperation {
  kind: string;
  hash: string;
  amount?: number;
  destination?: string;
  addedAt: string;
}

export async function getAll(accPkh: string, netId: string) {
  const storageKey = getKey(accPkh, netId);
  const pendingOperations: PendingOperation[] =
    (await browser.storage.local.get([storageKey]))[storageKey] || [];
  return pendingOperations;
}

export async function append(
  accPkh: string,
  netId: string,
  ops: PendingOperation[]
) {
  const currentItems = await getAll(accPkh, netId);
  await set(accPkh, netId, [...ops, ...currentItems]);
}

export async function remove(accPkh: string, netId: string, opIds: string[]) {
  const currentItems = await getAll(accPkh, netId);
  await set(
    accPkh,
    netId,
    currentItems.filter(({ hash }) => !opIds.includes(hash))
  );
}

function set(accPkh: string, netId: string, ops: PendingOperation[]) {
  return browser.storage.local.set({
    [getKey(accPkh, netId)]: ops,
  });
}

function getKey(accPkh: string, netId: string) {
  return `pndops_${netId}_${accPkh}`;
}

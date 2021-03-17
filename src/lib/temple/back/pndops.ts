import { OperationContentsAndResult } from "@taquito/rpc";
import { browser } from "webextension-polyfill-ts";

import { createQueue } from "lib/queue";
import { TemplePendingOperation } from "lib/temple/types";

export async function getAll(accPkh: string, netId: string) {
  const storageKey = getKey(accPkh, netId);
  const pendingOperations: TemplePendingOperation[] =
    (await browser.storage.local.get([storageKey]))[storageKey] || [];
  return pendingOperations;
}

export async function append(
  accPkh: string,
  netId: string,
  ops: TemplePendingOperation[]
) {
  const currentItems = await getAll(accPkh, netId);
  await set(accPkh, netId, [...ops, ...currentItems]);
}

export async function remove(
  accPkh: string,
  netId: string,
  opHashes: string[]
) {
  const currentItems = await getAll(accPkh, netId);
  await set(
    accPkh,
    netId,
    currentItems.filter(({ hash }) => !opHashes.includes(hash))
  );
}

const enqueueSet = createQueue();

export function set(
  accPkh: string,
  netId: string,
  ops: TemplePendingOperation[]
) {
  return enqueueSet(() =>
    browser.storage.local.set({
      [getKey(accPkh, netId)]: ops,
    })
  );
}

export function fromOpResults(
  opResults: OperationContentsAndResult[],
  hash: string,
  addedAt = new Date().toString()
): TemplePendingOperation[] {
  return opResults
    .concat()
    .reverse()
    .map((opResult) => ({ ...opResult, hash, addedAt }));
}

export function getKey(accPkh: string, netId: string) {
  return `pndops_${netId}_${accPkh}`;
}

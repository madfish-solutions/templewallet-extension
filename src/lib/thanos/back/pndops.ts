import { browser } from "webextension-polyfill-ts";
import { Queue } from "queue-ts";
import { OperationContentsAndResult } from "@taquito/rpc";
import { RawThanosPendingOperation } from "lib/thanos/types";

export async function getAll(accPkh: string, netId: string) {
  const storageKey = getKey(accPkh, netId);
  const pendingOperations: RawThanosPendingOperation[] =
    (await browser.storage.local.get([storageKey]))[storageKey] || [];
  return pendingOperations;
}

export async function append(
  accPkh: string,
  netId: string,
  ops: RawThanosPendingOperation[]
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

const setQueue = new Queue(1);

export function set(
  accPkh: string,
  netId: string,
  ops: RawThanosPendingOperation[]
) {
  return new Promise((resolve, reject) =>
    setQueue.add(() =>
      browser.storage.local
        .set({
          [getKey(accPkh, netId)]: ops,
        })
        .then(resolve)
        .catch(reject)
    )
  );
}

export function fromOpResults(
  opResults: OperationContentsAndResult[],
  hash: string,
  addedAt = new Date().toString()
): RawThanosPendingOperation[] {
  return opResults
    .concat()
    .reverse()
    .map((opResult) => ({ ...opResult, hash, addedAt }));
}

export function getKey(accPkh: string, netId: string) {
  return `pndops_${netId}_${accPkh}`;
}

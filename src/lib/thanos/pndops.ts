import { browser } from "webextension-polyfill-ts";
import { PendingOperation } from "lib/thanos/front";

export async function getAll(accPkh: string, netId: string) {
  const storageKey = `pndops_${netId}_${accPkh}`;
  const pendingOperations: PendingOperation[] =
    (await browser.storage.local.get([storageKey]))[storageKey] || [];
  return pendingOperations;
}

function set(accPkh: string, netId: string, ops: PendingOperation[]) {
  return browser.storage.local.set({
    [`pndops_${netId}_${accPkh}`]: ops,
  });
}

export async function append(
  accPkh: string,
  netId: string,
  ops: PendingOperation[]
) {
  const oldItems = await getAll(accPkh, netId);
  await set(accPkh, netId, [...ops, ...(oldItems || [])]);
}

export async function remove(accPkh: string, netId: string, opIds: string[]) {
  const oldItems = await getAll(accPkh, netId);
  await set(
    accPkh,
    netId,
    oldItems.filter(({ hash }) => !opIds.includes(hash))
  );
}

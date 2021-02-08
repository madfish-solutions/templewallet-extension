import { browser } from "webextension-polyfill-ts";
import { createQueue } from "lib/queue";

export type Items = { [key: string]: unknown } | [string, unknown][];

export const transact = createQueue();

export async function isStored(key: string) {
  const items = await browser.storage.local.get([key]);
  return key in items;
}

export async function fetchOne<T = any>(key: string) {
  const items = await browser.storage.local.get([key]);
  if (key in items) {
    return items[key] as T;
  } else {
    throw new Error("Some storage item not found");
  }
}

export function putOne<T>(key: string, value: T) {
  return putMany([[key, value]]);
}

export function putMany(items: Items) {
  if (Array.isArray(items)) {
    items = iterToObj(items);
  }
  return browser.storage.local.set(items);
}

export function remove(keys: string | string[]) {
  return browser.storage.local.remove(keys);
}

export function clear() {
  return browser.storage.local.clear();
}

function iterToObj(iter: [string, any][]) {
  const obj: { [k: string]: any } = {};
  for (const [k, v] of iter) {
    obj[k] = v;
  }
  return obj;
}

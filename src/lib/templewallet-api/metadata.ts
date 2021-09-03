import axios from "axios";

import { AssetMetadata } from "lib/temple/metadata";

const api = axios.create({ baseURL: "https://metadata.templewallet.com" });

export async function getTokensMetadata(slugs: string[], timeout?: number) {
  if (slugs.length === 0) return [];
  return api
    .post<(AssetMetadata | null)[]>("/", slugs, { timeout })
    .then((r) => r.data);
}

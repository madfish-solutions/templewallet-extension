import axios from "axios";

import { AssetMetadata } from "lib/temple/metadata";

const api = axios.create({ baseURL: "https://metadata.templewallet.com" });

export async function getTokensMetadata(slugs: string[]) {
  if (slugs.length === 0) return [];
  return api.post<(AssetMetadata | null)[]>("/", slugs).then((r) => r.data);
}

import axios from "axios";

import { TNBakerPreview, TNBaker } from "lib/tezos-nodes/types";

const api = axios.create({ baseURL: "https://api.tezos-nodes.com/v1" });
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (process.env.NODE_ENV === "development") {
      console.error(err);
    }

    throw err;
  }
);

export async function getAllBakers() {
  const { data: bakers } = await api.get<TNBakerPreview[]>("/bakers");
  return bakers.filter(isBakerPay).map(fixBakerLogo);
}

export async function getBaker(address: string) {
  const { data: baker } = await api.get<TNBaker>(`/baker/${address}`);
  if (!isBakerPay(baker)) return null;
  return fixBakerLogo(baker);
}

function fixBakerLogo<T extends TNBaker | TNBakerPreview>(baker: T) {
  return { ...baker, logo: baker.logo_min ?? baker.logo };
}

function isBakerPay<T extends TNBaker | TNBakerPreview>(baker: T) {
  return baker.deletation_status;
}

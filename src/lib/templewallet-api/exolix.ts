import axios from "axios";

const apiKey = process.env.EXOLIX_API_TOKEN;

axios.defaults.headers.common = { ...(apiKey && {Authorization: `bearer ${apiKey}`}) };

export interface exchangeDataInterface {
  amount_from: string;
  amount_to: string;
  coin_from: string;
  coin_to: string;
  created_at: number;
  deposit_address: string;
  deposit_extra: string | null;
  destination_address: string;
  destination_extra: string | null;
  hash_in: string | null;
  hash_in_link: string | null;
  hash_out: string | null;
  hash_out_link: string | null;
  id: string;
  message: string | null;
  rate: string;
  status: string;
}

const api = axios.create({ baseURL: "https://exolix.com/api" });

export const getCurrencies = async () => {
  return api.get("/currency").then((r) => r.data);
};

export const getRate = async (data: {
  coin_from: string;
  coin_to: string;
  deposit_amount: number;
}) => {
  return api.post("/rate", data).then((r) => r.data);
};

export const submitExchange = async (data: {
  coin_from: string;
  coin_to: string;
  deposit_amount: number;
  destination_address: string;
  destination_extra: string;
}) => {
  return api.post("/exchange", data).then((r) => r.data);
};

export const getExchangeData = async (
  exchangeId: string
): Promise<exchangeDataInterface> => {
  return api.get(`/exchange/${exchangeId}`).then((r) => r.data);
};

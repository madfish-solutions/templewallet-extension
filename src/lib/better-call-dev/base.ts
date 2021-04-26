import axios from "axios";

export const BASE_URL = "https://better-call.dev/v1";

export const api = axios.create({ baseURL: BASE_URL });

/**
 * Types
 */

export type BcdNetwork = "mainnet" | "edo2net" | "florencenet" | "delphinet";

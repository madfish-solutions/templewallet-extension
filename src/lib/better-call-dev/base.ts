import makeBuildQueryFn from "lib/makeBuildQueryFn";

export const BASE_URL = "https://api.better-call.dev/v1";

export const buildQuery =
  makeBuildQueryFn<Record<string, unknown>, any>(BASE_URL);

/**
 * Types
 */

export type BcdNetwork = "mainnet" | "edo2net" | "florencenet" | "delphinet";

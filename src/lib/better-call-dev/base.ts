import makeBuildQueryFn from "lib/makeBuildQueryFn";
import { TempleChainId } from "lib/temple/types";

export const BASE_URL = "https://api.better-call.dev/v1";
export const BCD_NETWORKS_NAMES = new Map<TempleChainId, BcdNetwork>([
  [TempleChainId.Mainnet, "mainnet"],
  [TempleChainId.Edo2net, "edo2net"],
  [TempleChainId.Florencenet, "florencenet"],
]);

export const buildQuery =
  makeBuildQueryFn<Record<string, unknown>, any>(BASE_URL);

/**
 * Types
 */

export type BcdNetwork = "mainnet" | "edo2net" | "florencenet" | "delphinet";

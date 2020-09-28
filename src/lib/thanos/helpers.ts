import BigNumber from "bignumber.js";
import memoize from "micro-memoize";
import { Tezos } from "@taquito/taquito";
import { RpcClient } from "@taquito/rpc";
import { ValidationResult, validateAddress } from "@taquito/utils";

export const loadChainId = memoize(fetchChainId, {
  isPromise: true,
  maxSize: 100,
});

export function fetchChainId(rpcUrl: string) {
  const rpc = new RpcClient(rpcUrl);
  return rpc.getChainId();
}

export function hasManager(manager: any) {
  return manager && typeof manager === "object" ? !!manager.key : !!manager;
}

export function tzToMutez(tz: any) {
  return Tezos.format("tz", "mutez", tz) as BigNumber;
}

export function mutezToTz(mutez: any) {
  return Tezos.format("mutez", "tz", mutez) as BigNumber;
}

export function isAddressValid(address: string) {
  return validateAddress(address) === ValidationResult.VALID;
}

export function isKTAddress(address: string) {
  return address?.startsWith("KT");
}

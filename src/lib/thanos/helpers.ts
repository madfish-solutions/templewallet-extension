import BigNumber from "bignumber.js";
import memoize from "micro-memoize";
import { RpcClient } from "@taquito/rpc";
import { ValidationResult, validateAddress } from "@taquito/utils";
import { getMessage } from "lib/i18n";

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
  const bigNum = new BigNumber(tz);
  if (bigNum.isNaN()) return bigNum;
  return bigNum.times(10 ** 6).integerValue();
}

export function mutezToTz(mutez: any) {
  const bigNum = new BigNumber(mutez);
  if (bigNum.isNaN()) return bigNum;
  return bigNum.integerValue().div(10 ** 6);
}

export function isAddressValid(address: string) {
  return validateAddress(address) === ValidationResult.VALID;
}

export function isKTAddress(address: string) {
  return address?.startsWith("KT");
}

export function validateDerivationPath(p: string) {
  if (!p.startsWith("m")) {
    return getMessage("derivationPathMustStartWithM");
  }
  if (p.length > 1 && p[1] !== "/") {
    return getMessage("derivationSeparatorMustBeSlash");
  }

  const parts = p.replace("m", "").split("/").filter(Boolean);
  if (
    !parts.every((p) => {
      const pNum = +(p.includes("'") ? p.replace("'", "") : p);
      return Number.isSafeInteger(pNum) && pNum >= 0;
    })
  ) {
    return getMessage("invalidPath");
  }

  return true;
}

export function validateContractAddress(value: any) {
  switch (false) {
    case isAddressValid(value):
      return getMessage("invalidAddress");

    case isKTAddress(value):
      return getMessage("onlyKTContractAddressAllowed");

    default:
      return true;
  }
}

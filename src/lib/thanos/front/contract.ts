import mem from "mem";
import { TezosToolkit } from "@taquito/taquito";

export const loadContract = mem(fetchContract, {
  cacheKey: (args: any[]) => `${args[0].checksum}_${args[1]}`,
});

export function fetchContract(tezos: TezosToolkit, address: string) {
  return tezos.contract.at(address);
}

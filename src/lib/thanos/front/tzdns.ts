import { TezosToolkit } from "@taquito/taquito";
import {
  TezosDomainsClient
} from "@tezos-domains/client";
import {
  DomainNameValidationResult,
  isTezosDomainsSupportedNetwork,
} from "@tezos-domains/core";
import memoize from "micro-memoize";

const getClient = memoize(
  (networkId: string, tezos: TezosToolkit) => {
    if (isTezosDomainsSupportedNetwork(networkId)) {
      return new TezosDomainsClient({ network: networkId, tezos });
    }

    return TezosDomainsClient.Unsupported;
  },
  {
    maxSize: 100
  }
);

export function isDomainNameValid(name: string, networkId: string, tezos: TezosToolkit) {
  const client = getClient(networkId, tezos);
  return (
    client.validator.validateDomainName(name) === DomainNameValidationResult.VALID
  );
}

export async function resolveDomainAddress(
  name: string,
  networkId: string,
  tezos: TezosToolkit
) {
  const client = getClient(networkId, tezos);
  return client.resolver.resolveNameToAddress(name);
}

export async function resolveAddressToName(
  address: string,
  networkId: string,
  tezos: TezosToolkit
) {
  const client = getClient(networkId, tezos);
  return client.resolver.resolveAddressToName(address);
}

import { TezosToolkit } from "@taquito/taquito";
import {
  TezosDomainsClient
} from "@tezos-domains/client";
import {
  DomainNameValidationResult,
  isTezosDomainsSupportedNetwork,
} from "@tezos-domains/core";

export function getClient(networkId: string, tezos: TezosToolkit) {
  if (isTezosDomainsSupportedNetwork(networkId)) {
    return new TezosDomainsClient({ network: networkId, tezos });
  }

  return TezosDomainsClient.Unsupported;
}

export function isDomainNameValid(name: string, client: TezosDomainsClient) {
  return (
    client.validator.validateDomainName(name) === DomainNameValidationResult.VALID
  );
}

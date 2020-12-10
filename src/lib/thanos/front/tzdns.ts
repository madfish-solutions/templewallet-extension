import { TezosToolkit } from "@taquito/taquito";
import { TezosDomainsClient } from "@tezos-domains/client";
import {
  DomainNameValidationResult,
  isTezosDomainsSupportedNetwork,
} from "@tezos-domains/core";

export function getClient(networkId: string, tezos: TezosToolkit) {
  return isTezosDomainsSupportedNetwork(networkId)
    ? new TezosDomainsClient({ network: networkId, tezos })
    : TezosDomainsClient.Unsupported;
}

export function isDomainNameValid(name: string, client: TezosDomainsClient) {
  return (
    client.validator.validateDomainName(name) ===
    DomainNameValidationResult.VALID
  );
}

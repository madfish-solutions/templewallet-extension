import { TezosToolkit } from "@taquito/taquito";
import {
  DomainNameValidationResult,
  isTezosDomainsSupportedNetwork,
} from "@tezos-domains/core";
import { TaquitoTezosDomainsClient } from "@tezos-domains/taquito-client";

export function getClient(networkId: string, tezos: TezosToolkit) {
  if (networkId === "edo2net") {
    networkId = "edonet";
  }

  return isTezosDomainsSupportedNetwork(networkId)
    ? new TaquitoTezosDomainsClient({ network: networkId, tezos })
    : TaquitoTezosDomainsClient.Unsupported;
}

export function isDomainNameValid(
  name: string,
  client: TaquitoTezosDomainsClient
) {
  return (
    client.validator.validateDomainName(name) ===
    DomainNameValidationResult.VALID
  );
}

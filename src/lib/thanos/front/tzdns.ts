import {
  DomainNameValidator,
  DomainNameValidationResult,
} from "@tezos-domains/core";
import {
  NameResolver,
  NullNameResovler,
  TezosDomainsResolver,
} from "@tezos-domains/resolver";
import { ReactiveTezosToolkit } from "./ready";

// TODO: add mainnet when valid contracts addresses appear here
// https://gitlab.com/tezos-domains/client/-/blob/master/packages/core/src/address-book/built-in-addresses.ts#L4
type TzdnsSupportedNetwork = "carthagenet" | "delphinet";
const SUPPORTED_NETWORKS = ["carthagenet", "delphinet"];
export function isTzdnsSupportedNetwork(
  networkId: string
): networkId is TzdnsSupportedNetwork {
  return SUPPORTED_NETWORKS.includes(networkId);
}

const validator = new DomainNameValidator();

export function isDomainNameValid(name: string) {
  return (
    validator.validateDomainName(name) === DomainNameValidationResult.VALID
  );
}

export function domainsResolverFactory(
  tezos: ReactiveTezosToolkit,
  networkId: string
) {
  if (!isTzdnsSupportedNetwork(networkId)) {
    return new NullNameResovler();
  }

  return new TezosDomainsResolver({
    network: networkId,
    tezos,
    caching: { enabled: true },
    // contractAddresses: networkId === "delphinet" ? DELPHINET_CONTRACT_ADDRESSES : undefined
  });
}

export function resolveReverseName(
  _k: string,
  accountPkh: string,
  tezosDomains: NameResolver
) {
  return tezosDomains.reverseResolveName(accountPkh);
}

export async function resolveDomainName(
  _k: string,
  domainName: string,
  tezosDomains: NameResolver
) {
  if (isDomainNameValid(domainName)) {
    return tezosDomains.resolveAddress(domainName);
  }
  return null;
}

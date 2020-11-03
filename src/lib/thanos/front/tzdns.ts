import { TezosToolkit } from "@taquito/taquito";
import {
  DomainNameValidator,
  DomainNameValidationResult,
  DefaultNetworkConfig,
  TezosDomainsConfig,
} from "@tezos-domains/core";
import {
  NameResolver,
  NullNameResovler,
  TezosDomainsResolver,
} from "@tezos-domains/resolver";
import memoize from "micro-memoize";

// TODO: add mainnet when valid contracts addresses appear here
// https://gitlab.com/tezos-domains/client/-/blob/master/packages/core/src/address-book/built-in-addresses.ts#L4
type TzdnsSupportedNetwork = "carthagenet" | "delphinet";
const SUPPORTED_NETWORKS = ["carthagenet", "delphinet"];
export function isTzdnsSupportedNetwork(
  networkId: string
): networkId is TzdnsSupportedNetwork {
  return SUPPORTED_NETWORKS.includes(networkId);
}

const getValidator = memoize(
  (networkId: string) => {
    const config: TezosDomainsConfig | undefined = isTzdnsSupportedNetwork(
      networkId
    )
      ? ({ network: networkId } as DefaultNetworkConfig)
      : undefined;
    return new DomainNameValidator(config);
  },
  {
    maxSize: 100,
  }
);

export function isDomainNameValid(name: string, networkId: string) {
  const validator = getValidator(networkId);
  return (
    validator.validateDomainName(name) === DomainNameValidationResult.VALID
  );
}

export function domainsResolverFactory(tezos: TezosToolkit, networkId: string) {
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

export async function resolveDomainAddress(
  tezosDomains: NameResolver,
  name: string,
  networkId: string
) {
  if (isDomainNameValid(name, networkId)) {
    return tezosDomains.resolveNameToAddress(name);
  }
  return null;
}

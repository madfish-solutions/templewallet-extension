import { EvmChain, TezosChain } from 'temple/front';

export const searchAndFilterNetworks = (networks: (string | EvmChain | TezosChain)[], searchValue: string) => {
  const preparedSearchValue = searchValue.trim().toLowerCase();

  return networks.filter(network => {
    if (typeof network === 'string') return network.toLowerCase().includes(preparedSearchValue);

    return network.name.toLowerCase().includes(preparedSearchValue);
  });
};

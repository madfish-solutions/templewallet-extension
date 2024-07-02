type SearchNetwork = string | { name: string };

export const searchAndFilterNetworks = <T extends SearchNetwork>(networks: T[], searchValue: string) => {
  const preparedSearchValue = searchValue.trim().toLowerCase();

  return networks.filter(network => {
    if (typeof network === 'string') return network.toLowerCase().includes(preparedSearchValue);

    return network.name.toLowerCase().includes(preparedSearchValue);
  });
};

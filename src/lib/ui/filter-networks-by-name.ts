import { searchAndFilterItems } from 'lib/utils/search-items';

type SearchNetwork = string | { name: string };

export const filterNetworksByName = <T extends SearchNetwork>(networks: T[], searchValue: string) => {
  const preparedSearchValue = searchValue.trim().toLowerCase();

  return preparedSearchValue
    ? searchAndFilterItems(
        networks.filter(network => typeof network !== 'string'),
        preparedSearchValue,
        [{ name: 'name', weight: 1 }]
      )
    : networks;
};

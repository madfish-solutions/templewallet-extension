import { t } from 'lib/i18n';
import { searchAndFilterItems } from 'lib/utils/search-items';
import { OneOfChains } from 'temple/front';

export function searchAndFilterChains<T extends string | OneOfChains>(networks: T[], searchValue: string) {
  const searchableNetworks = networks.filter((network): network is Exclude<T, string> => typeof network !== 'string');

  return searchAndFilterItems(
    searchableNetworks,
    searchValue.trim(),
    [
      { name: 'name', weight: 1 },
      { name: 'nameI18n', weight: 1 }
    ],
    value => ({
      name: value.name,
      nameI18n: value.nameI18nKey ? t(value.nameI18nKey) : undefined
    })
  );
}

import { t } from 'lib/i18n';
import { searchAndFilterItems } from 'lib/utils/search-items';
import { OneOfChains } from 'temple/front';

export function searchAndFilterChains(networks: OneOfChains[], searchValue: string) {
  return searchAndFilterItems(
    networks,
    searchValue.trim(),
    [
      { name: 'name', weight: 1 },
      { name: 'nameI18n', weight: 1 }
    ],
    ({ name, nameI18nKey }) => ({
      name,
      nameI18n: nameI18nKey ? t(nameI18nKey) : undefined
    })
  );
}

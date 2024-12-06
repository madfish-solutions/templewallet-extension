import { t } from 'lib/i18n';
import { searchAndFilterItems } from 'lib/utils/search-items';
import { OneOfChains } from 'temple/front';

export function searchAndFilterChains<T extends string | OneOfChains>(networks: T[], searchValue: string) {
  return searchAndFilterItems(
    networks,
    searchValue.trim(),
    [
      { name: 'name', weight: 1 },
      { name: 'nameI18n', weight: 1 }
    ],
    value =>
      typeof value === 'string'
        ? { name: value }
        : {
            name: value.name,
            nameI18n: value.nameI18nKey ? t(value.nameI18nKey) : undefined
          }
  );
}

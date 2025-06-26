import { TempleContact } from 'lib/temple/types';
import { searchAndFilterItems } from 'lib/utils/search-items';

export const isEvmContact = (address: string) => address.startsWith('0x');

export const searchAndFilterContacts = (contacts: TempleContact[], searchValue: string) => {
  const preparedSearchValue = searchValue.trim().toLowerCase();

  return searchAndFilterItems(
    contacts,
    preparedSearchValue,
    [
      { name: 'name', weight: 1 },
      { name: 'address', weight: 0.75 }
    ],
    null,
    0.35
  );
};

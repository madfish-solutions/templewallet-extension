import { TID, t } from 'lib/i18n';
import { DisplayedGroup, StoredAccount, StoredHDAccount, TempleAccountType } from 'lib/temple/types';

const nonHdGroupsNamesI18nKeys: Record<Exclude<TempleAccountType, TempleAccountType.HD>, TID> = {
  [TempleAccountType.Imported]: 'importedGroupLabel',
  [TempleAccountType.Ledger]: 'ledgerGroupLabel',
  [TempleAccountType.ManagedKT]: 'managedKTAccount',
  [TempleAccountType.WatchOnly]: 'watchOnlyAccount'
};

export const getAllGroups = (hdGroups: Pick<DisplayedGroup, 'id' | 'name'>[], accounts: StoredAccount[]) => {
  const displayedHdGroups: DisplayedGroup[] = hdGroups
    .map(({ id, name }) => ({
      type: TempleAccountType.HD,
      id,
      name,
      accounts: accounts.filter(
        (acc): acc is StoredHDAccount => acc.type === TempleAccountType.HD && acc.walletId === id
      )
    }))
    .filter(({ accounts }) => accounts.length > 0);

  (
    [
      TempleAccountType.Imported,
      TempleAccountType.Ledger,
      TempleAccountType.ManagedKT,
      TempleAccountType.WatchOnly
    ] as const
  ).forEach(type => {
    const groupAccounts = accounts.filter(acc => acc.type === type);

    if (groupAccounts.length) {
      displayedHdGroups.push({
        type,
        id: String(type),
        name: t(nonHdGroupsNamesI18nKeys[type]),
        accounts: groupAccounts
      });
    }
  });

  return displayedHdGroups;
};

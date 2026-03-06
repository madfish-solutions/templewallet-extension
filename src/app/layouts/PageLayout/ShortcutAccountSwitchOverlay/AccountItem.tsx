import { FC, RefObject } from 'react';

import { isDefined } from '@rnw-community/shared';
import clsx from 'clsx';

import { Name, Button } from 'app/atoms';
import { AccountAvatar } from 'app/atoms/AccountAvatar';
import { SearchHighlightText } from 'app/atoms/SearchHighlightText';
import { TotalEquity } from 'app/atoms/TotalEquity';
import { useEquityCurrency } from 'app/hooks/use-equity-currency';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { T } from 'lib/i18n';
import { StoredAccount } from 'lib/temple/types';
import { useScrollIntoView } from 'lib/ui/use-scroll-into-view';
import { combineRefs } from 'lib/ui/utils';

import { ShortcutAccountSwitchSelectors } from './selectors';

const scrollIntoViewOptions: ScrollIntoViewOptions = { block: 'center', behavior: 'smooth' };

interface AccountItemProps {
  account: StoredAccount;
  focused: boolean;
  onAccountSelect: SyncFn<string>;
  searchValue: string;
  arrayIndex?: number;
  itemsArrayRef?: RefObject<Array<HTMLButtonElement | null>>;
}

const baseRowClasses = clsx(
  'block w-full p-2 flex items-center rounded-lg',
  'overflow-hidden transition ease-in-out duration-200',
  'border-0.5 border-lines'
);

export const AccountItem: FC<AccountItemProps> = ({
  account,
  focused,
  onAccountSelect,
  searchValue,
  arrayIndex,
  itemsArrayRef
}) => {
  const elemRef = useScrollIntoView<HTMLButtonElement>(focused, scrollIntoViewOptions);

  const { filterChain } = useAssetsFilterOptionsSelector();
  const { equityCurrency } = useEquityCurrency();

  return (
    <Button
      ref={combineRefs(elemRef, el => {
        if (isDefined(arrayIndex) && itemsArrayRef?.current) {
          itemsArrayRef.current[arrayIndex] = el;
        }
      })}
      className={clsx(baseRowClasses, focused ? 'border-transparent bg-secondary-low' : 'hover:bg-grey-4')}
      onClick={() => onAccountSelect(account.id)}
      testID={ShortcutAccountSwitchSelectors.accountItemButton}
      testIDProperties={{ accountTypeEnum: account.type }}
    >
      <div className="flex flex-1 flex-row justify-between items-center">
        <div className="flex items-center flex-row gap-x-2">
          <AccountAvatar seed={account.id} size={32} borderColor="gray" />
          <Name className="text-font-description-bold">
            <SearchHighlightText searchValue={searchValue}>{account.name}</SearchHighlightText>
          </Name>
        </div>

        <div className="flex flex-col justify-end">
          <div className="text-font-small text-grey-1">
            <T id={'totalBalance'} />
          </div>

          <div className="text-font-num-12 text-right">
            <TotalEquity account={account} filterChain={filterChain} currency={equityCurrency} />
          </div>
        </div>
      </div>
    </Button>
  );
};

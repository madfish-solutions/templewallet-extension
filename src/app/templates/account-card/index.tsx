import React, { ComponentType, FC, memo } from 'react';

import clsx from 'clsx';

import { IconBase, Name } from 'app/atoms';
import { AccLabel } from 'app/atoms/AccLabel';
import { AccountAvatar } from 'app/atoms/AccountAvatar';
import { AccountName as DefaultAccountName } from 'app/atoms/AccountName';
import { RadioButton } from 'app/atoms/RadioButton';
import { SearchHighlightText } from 'app/atoms/SearchHighlightText';
import { TotalEquity } from 'app/atoms/TotalEquity';
import { useEquityCurrency } from 'app/hooks/use-equity-currency';
import { ReactComponent as CompactDown } from 'app/icons/base/compact_down.svg';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { t } from 'lib/i18n';
import { StoredAccount } from 'lib/temple/types';
import { useScrollIntoViewOnMount } from 'lib/ui/use-scroll-into-view';
import useTippy from 'lib/ui/useTippy';

import { CopyAccountAddresses } from '../copy-account-addresses';

import { AccountCardSelectors } from './selectors';

export interface AccountCardProps {
  account: StoredAccount;
  AccountName?: ComponentType<{ account: StoredAccount; searchValue?: string }>;
  balanceLabel?: string;
  BalanceValue?: ComponentType<{ account: StoredAccount }>;
  customLabelTitle?: string;
  isCurrent: boolean;
  showRadioOnHover?: boolean;
  showCompactDownIcon?: boolean;
  searchValue?: string;
  attractSelf: boolean;
  alwaysShowAddresses?: boolean;
  isRewardsAccount?: boolean;
  onClick?: EmptyFn;
}

export const AccountCard = memo<AccountCardProps>(
  ({
    account,
    customLabelTitle,
    BalanceValue = DefaultBalanceValue,
    balanceLabel = 'Total Balance:',
    isCurrent,
    attractSelf,
    showRadioOnHover = true,
    showCompactDownIcon = false,
    searchValue,
    alwaysShowAddresses = false,
    AccountName = alwaysShowAddresses ? SimpleAccountName : DefaultAccountName,
    isRewardsAccount = false,
    onClick
  }) => {
    const elemRef = useScrollIntoViewOnMount<HTMLDivElement>(isCurrent && attractSelf);

    return (
      <div
        ref={elemRef}
        className={clsx(
          'flex flex-col bg-white',
          alwaysShowAddresses ? 'p-3 gap-y-2' : 'p-2 gap-y-1.5',
          'rounded-lg shadow-bottom border',
          alwaysShowAddresses && 'ease-out duration-300',
          isCurrent ? 'border-primary' : 'cursor-pointer group border-transparent hover:border-lines'
        )}
        onClick={onClick}
      >
        <div className="flex gap-x-1 items-center">
          <AccountAvatar seed={account.id} size={alwaysShowAddresses ? 24 : 32} borderColor="gray" />

          <AccountName account={account} searchValue={searchValue} />

          {isRewardsAccount && <RewardsAccountLabel />}

          <div className="flex-1" />

          {showCompactDownIcon ? (
            <IconBase Icon={CompactDown} className="text-primary" />
          ) : (
            <RadioButton
              active={isCurrent}
              className={clsx(
                'ease-out duration-300',
                !isCurrent && 'opacity-0',
                !isCurrent && showRadioOnHover && 'group-hover:opacity-100'
              )}
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 flex flex-col">
            <div className="text-font-small text-grey-1">{balanceLabel}</div>

            <div className="text-font-num-14">
              <BalanceValue account={account} />
            </div>
          </div>

          {alwaysShowAddresses ? (
            <CopyAccountAddresses
              account={account}
              tezosButtonTestID={AccountCardSelectors.copyTezosAddressButton}
              evmButtonTestID={AccountCardSelectors.copyEvmAddressButton}
            />
          ) : (
            <AccLabel type={account.type} customTitle={customLabelTitle} />
          )}
        </div>
      </div>
    );
  }
);

const DefaultBalanceValue: FC<{ account: StoredAccount }> = ({ account }) => {
  const { filterChain } = useAssetsFilterOptionsSelector();
  const { equityCurrency } = useEquityCurrency();

  return <TotalEquity account={account} filterChain={filterChain} currency={equityCurrency} />;
};

const SimpleAccountName = memo<{ account: StoredAccount; searchValue?: string }>(({ account, searchValue }) => (
  <Name className="text-font-medium-bold flex items-center">
    {searchValue ? <SearchHighlightText searchValue={searchValue}>{account.name}</SearchHighlightText> : account.name}
  </Name>
));

const rewardsAccountLabelTippyProps = {
  trigger: 'mouseenter',
  hideOnClick: false,
  animation: 'shift-away-subtle',
  content: t('rewardsAccountTooltip')
};

const RewardsAccountLabel = memo(() => {
  const rootRef = useTippy<HTMLDivElement>(rewardsAccountLabelTippyProps);

  return (
    <div
      className="p-1 ml-1 rounded text-white text-font-small-bold"
      style={{ background: 'linear-gradient(136deg, #FF5B00 -2.06%, #F4BE38 103.52%)' }}
      ref={rootRef}
    >
      Rewards
    </div>
  );
});

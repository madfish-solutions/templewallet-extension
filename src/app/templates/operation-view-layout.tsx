import React, { useMemo } from 'react';

import { Loader } from 'app/atoms';
import { StoredAccount } from 'lib/temple/types';
import { AssetsAmounts } from 'temple/types';

import { AccountCard } from './account-card';
import { BalancesChangesView } from './balances-changes-view';
import { TransactionTabs, TransactionTabsProps } from './TransactionTabs';
import { TxParamsFormData } from './TransactionTabs/types';

interface OperationViewLayoutProps<T extends TxParamsFormData> extends TransactionTabsProps<T> {
  sendingAccount: StoredAccount;
  balancesChanges: AssetsAmounts;
  otherDataLoading: boolean;
  metadataLoading: boolean;
}

export const OperationViewLayout = <T extends TxParamsFormData>({
  sendingAccount,
  balancesChanges,
  otherDataLoading,
  metadataLoading,
  network,
  ...restProps
}: OperationViewLayoutProps<T>) => {
  const filteredBalancesChanges = useMemo(
    () => Object.fromEntries(Object.entries(balancesChanges).filter(([, { atomicAmount }]) => !atomicAmount.isZero())),
    [balancesChanges]
  );
  const someBalancesChanges = useMemo(() => Object.keys(filteredBalancesChanges).length > 0, [filteredBalancesChanges]);
  const expensesViewIsVisible = someBalancesChanges && !metadataLoading;

  return (
    <>
      {someBalancesChanges && (
        <div className={expensesViewIsVisible ? undefined : 'hidden'}>
          <BalancesChangesView balancesChanges={[filteredBalancesChanges]} chain={network} />
        </div>
      )}
      {someBalancesChanges && (otherDataLoading || metadataLoading) && (
        <div className="flex justify-center items-center">
          <Loader size="L" trackVariant="dark" className="text-secondary" />
        </div>
      )}

      <div className="flex flex-col mt-4">
        <AccountCard
          account={sendingAccount}
          isCurrent={false}
          attractSelf={false}
          showRadioOnHover={false}
          alwaysShowAddresses
        />

        <TransactionTabs<T> network={network} {...restProps} />
      </div>
    </>
  );
};

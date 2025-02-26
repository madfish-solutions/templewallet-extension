import React, { useMemo } from 'react';

import { Loader } from 'app/atoms';
import { StoredAccount } from 'lib/temple/types';
import { AssetsAmounts } from 'temple/types';

import { AccountCard } from './AccountCard';
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
  const expensesViewIsVisible = useMemo(
    () => Object.keys(filteredBalancesChanges).length > 0 && !metadataLoading,
    [filteredBalancesChanges, metadataLoading]
  );

  return (
    <>
      {expensesViewIsVisible ? (
        <BalancesChangesView balancesChanges={filteredBalancesChanges} chain={network} />
      ) : (
        (otherDataLoading || metadataLoading) && (
          <div className="flex justify-center items-center">
            <Loader size="L" trackVariant="dark" className="text-primary" />
          </div>
        )
      )}

      <div className="flex flex-col">
        <AccountCard account={sendingAccount} isCurrent={false} attractSelf={false} showRadioOnHover={false} />

        <TransactionTabs<T> network={network} {...restProps} />
      </div>
    </>
  );
};

import React, { useCallback, useMemo, ReactNode } from 'react';

import { Loader } from 'app/atoms';
import { FeeSummary } from 'app/templates/fee-summary';
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
  renderApproveLayout?: (footer: ReactNode) => ReactNode;
}

export const OperationViewLayout = <T extends TxParamsFormData>({
  sendingAccount,
  balancesChanges,
  otherDataLoading,
  metadataLoading,
  network,
  renderApproveLayout,
  setSelectedTab,
  ...restProps
}: OperationViewLayoutProps<T>) => {
  const filteredBalancesChanges = useMemo(
    () => Object.fromEntries(Object.entries(balancesChanges).filter(([, { atomicAmount }]) => !atomicAmount.isZero())),
    [balancesChanges]
  );
  const someBalancesChanges = useMemo(() => Object.keys(filteredBalancesChanges).length > 0, [filteredBalancesChanges]);
  const expensesViewIsVisible = someBalancesChanges && !metadataLoading;
  const showStandaloneFeeSummary =
    !someBalancesChanges && !renderApproveLayout && !otherDataLoading && !metadataLoading;
  const showLoader = someBalancesChanges && (otherDataLoading || metadataLoading);

  const goToFeeTab = useCallback(() => setSelectedTab('fee'), [setSelectedTab]);

  return (
    <>
      {someBalancesChanges ? (
        <div className={expensesViewIsVisible ? undefined : 'hidden'}>
          <BalancesChangesView
            balancesChanges={[filteredBalancesChanges]}
            chain={network}
            footer={
              <FeeSummary
                network={network}
                assetSlug={restProps.nativeAssetSlug}
                gasFee={restProps.displayedFee}
                storageFee={restProps.displayedStorageFee}
                protocolFee={restProps.bridgeData?.protocolFee}
                onOpenFeeTab={goToFeeTab}
                embedded
              />
            }
          />
        </div>
      ) : renderApproveLayout ? (
        <div className={!metadataLoading ? undefined : 'hidden'}>
          {renderApproveLayout(
            <FeeSummary
              network={network}
              assetSlug={restProps.nativeAssetSlug}
              gasFee={restProps.displayedFee}
              storageFee={restProps.displayedStorageFee}
              protocolFee={restProps.bridgeData?.protocolFee}
              onOpenFeeTab={goToFeeTab}
              embedded
            />
          )}
        </div>
      ) : (
        showStandaloneFeeSummary && (
          <FeeSummary
            network={network}
            assetSlug={restProps.nativeAssetSlug}
            gasFee={restProps.displayedFee}
            storageFee={restProps.displayedStorageFee}
            protocolFee={restProps.bridgeData?.protocolFee}
            onOpenFeeTab={goToFeeTab}
          />
        )
      )}
      {showLoader && (
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

        <TransactionTabs<T> network={network} setSelectedTab={setSelectedTab} {...restProps} />
      </div>
    </>
  );
};

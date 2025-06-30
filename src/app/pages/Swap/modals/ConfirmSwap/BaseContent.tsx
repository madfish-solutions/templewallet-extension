import React from 'react';

import { SubmitHandler, useFormContext } from 'react-hook-form-v7';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { Loader } from 'app/atoms';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { StyledButton } from 'app/atoms/StyledButton';
import { BalancesChangesView } from 'app/templates/balances-changes-view';
import { CurrentAccount } from 'app/templates/current-account';
import { LedgerApprovalModal } from 'app/templates/ledger-approval-modal';
import { TransactionTabs } from 'app/templates/TransactionTabs';
import { Tab, TxParamsFormData } from 'app/templates/TransactionTabs/types';
import { t, T } from 'lib/i18n';
import { DisplayedFeeOptions, FeeOptionLabel } from 'lib/temple/front/estimation-data-providers';
import { LedgerOperationState } from 'lib/ui';
import { OneOfChains } from 'temple/front';

interface BaseContentProps<T extends TxParamsFormData> {
  ledgerApprovalModalState: LedgerOperationState;
  onLedgerModalClose: EmptyFn;
  network: OneOfChains;
  nativeAssetSlug: string;
  someBalancesChanges: boolean;
  filteredBalancesChanges: any;
  selectedTab: Tab;
  setSelectedTab: SyncFn<Tab>;
  selectedFeeOption: FeeOptionLabel | nullish;
  latestSubmitError: string | nullish;
  onFeeOptionSelect: SyncFn<FeeOptionLabel>;
  onSubmit: SubmitHandler<T>;
  onCancel: EmptyFn;
  minimumReceived?: {
    amount: string;
    symbol: string;
  };
  displayedFee?: string;
  displayedStorageFee?: string;
  displayedFeeOptions?: DisplayedFeeOptions;
}

export const BaseContent = <T extends TxParamsFormData>({
  ledgerApprovalModalState,
  network,
  nativeAssetSlug,
  someBalancesChanges,
  filteredBalancesChanges,
  selectedFeeOption,
  selectedTab,
  latestSubmitError,
  onFeeOptionSelect,
  setSelectedTab,
  onSubmit,
  onCancel,
  onLedgerModalClose,
  minimumReceived,
  displayedFee,
  displayedStorageFee,
  displayedFeeOptions
}: BaseContentProps<T>) => {
  const { formState } = useFormContext<T>();

  return (
    <>
      <div className="px-4 flex flex-col flex-1 overflow-y-scroll">
        <div className="my-4">
          {someBalancesChanges ? (
            <FadeTransition>
              <BalancesChangesView title={t('swapDetails')} balancesChanges={filteredBalancesChanges} chain={network} />
            </FadeTransition>
          ) : (
            <div className="flex justify-center items-center py-4">
              <Loader size="L" trackVariant="dark" className="text-secondary" />
            </div>
          )}
        </div>

        <CurrentAccount />

        <TransactionTabs<T>
          network={network}
          nativeAssetSlug={nativeAssetSlug}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          selectedFeeOption={selectedFeeOption}
          latestSubmitError={latestSubmitError}
          onFeeOptionSelect={onFeeOptionSelect}
          onSubmit={onSubmit}
          displayedFee={displayedFee}
          displayedStorageFee={displayedStorageFee}
          displayedFeeOptions={displayedFeeOptions}
          minimumReceived={minimumReceived}
          formId="confirm-form"
          tabsName="confirm-send-tabs"
        />
      </div>

      <ActionsButtonsBox flexDirection="row" shouldChangeBottomShift={false}>
        <StyledButton size="L" className="w-full" color="primary-low" onClick={onCancel}>
          <T id="cancel" />
        </StyledButton>

        <StyledButton
          type="submit"
          form="confirm-form"
          color="primary"
          size="L"
          className="w-full"
          loading={formState.isSubmitting}
          disabled={!formState.isValid}
        >
          <T id={latestSubmitError ? 'retry' : 'confirm'} />
        </StyledButton>
      </ActionsButtonsBox>

      <LedgerApprovalModal state={ledgerApprovalModalState} onClose={onLedgerModalClose} />
    </>
  );
};

import React, { useCallback } from 'react';

import { SubmitHandler, useFormContext } from 'react-hook-form-v7';

import { HashChip } from 'app/atoms/HashChip';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { StyledButton } from 'app/atoms/StyledButton';
import { BalancesChangesView } from 'app/templates/balances-changes-view';
import { CurrentAccount } from 'app/templates/current-account';
import { FeeSummary } from 'app/templates/fee-summary';
import { LedgerApprovalModal } from 'app/templates/ledger-approval-modal';
import { TransactionTabs } from 'app/templates/TransactionTabs';
import { Tab, TxParamsFormData } from 'app/templates/TransactionTabs/types';
import { T } from 'lib/i18n';
import { DisplayedFeeOptions, FeeOptionLabel } from 'lib/temple/front/estimation-data-providers';
import { LedgerOperationState } from 'lib/ui';
import { OneOfChains } from 'temple/front';

import { useSendBalancesChanges } from './use-send-balances-changes';
interface BaseContentProps<T extends TxParamsFormData> {
  ledgerApprovalModalState: LedgerOperationState;
  network: OneOfChains;
  assetSlug: string;
  amount: string;
  recipientAddress: string;
  selectedTab: Tab;
  setSelectedTab: SyncFn<Tab>;
  selectedFeeOption: FeeOptionLabel | nullish;
  latestSubmitError: unknown;
  onFeeOptionSelect: SyncFn<FeeOptionLabel>;
  onSubmit: SubmitHandler<T>;
  onCancel: EmptyFn;
  onLedgerModalClose: EmptyFn;
  displayedFee?: string;
  displayedStorageFee?: string;
  displayedFeeOptions?: DisplayedFeeOptions;
  decimals?: number;
}

export const BaseContent = <T extends TxParamsFormData>({
  ledgerApprovalModalState,
  network,
  assetSlug,
  recipientAddress,
  amount,
  selectedFeeOption,
  selectedTab,
  latestSubmitError,
  onFeeOptionSelect,
  setSelectedTab,
  onSubmit,
  onCancel,
  onLedgerModalClose,
  displayedFee,
  displayedStorageFee,
  displayedFeeOptions,
  decimals
}: BaseContentProps<T>) => {
  const { formState } = useFormContext<T>();

  const goToFeeTab = useCallback(() => setSelectedTab('fee'), [setSelectedTab]);

  const balancesChanges = useSendBalancesChanges(assetSlug, amount, decimals);

  return (
    <>
      <div className="px-4 flex flex-col flex-1 overflow-y-scroll">
        <div className="my-4">
          <BalancesChangesView
            balancesChanges={balancesChanges}
            chain={network}
            footer={
              <FeeSummary
                network={network}
                assetSlug={assetSlug}
                gasFee={displayedFee}
                storageFee={displayedStorageFee}
                onOpenFeeTab={goToFeeTab}
                embedded
              />
            }
          />
        </div>
        <CurrentAccount />

        <TransactionTabs<T>
          network={network}
          nativeAssetSlug={assetSlug}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          selectedFeeOption={selectedFeeOption}
          latestSubmitError={latestSubmitError}
          onFeeOptionSelect={onFeeOptionSelect}
          onSubmit={onSubmit}
          displayedFeeOptions={displayedFeeOptions}
          formId="confirm-form"
          tabsName="confirm-send-tabs"
          destinationName={<T id="recipient" />}
          destinationValue={<HashChip hash={recipientAddress} />}
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

      <LedgerApprovalModal state={ledgerApprovalModalState} onClose={onLedgerModalClose} chainKind={network.kind} />
    </>
  );
};

import React from 'react';

import { SubmitHandler, useFormContext } from 'react-hook-form-v7';

import { HashChip } from 'app/atoms/HashChip';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { StyledButton } from 'app/atoms/StyledButton';
import { CurrentAccount } from 'app/templates/current-account';
import { LedgerApprovalModal } from 'app/templates/ledger-approval-modal';
import { OneAssetHeader } from 'app/templates/one-asset-header';
import { TransactionTabs } from 'app/templates/TransactionTabs';
import { Tab, TxParamsFormData } from 'app/templates/TransactionTabs/types';
import { T } from 'lib/i18n';
import { DisplayedFeeOptions, FeeOptionLabel } from 'lib/temple/front/estimation-data-providers';
import { LedgerOperationState } from 'lib/ui';
import { OneOfChains } from 'temple/front';

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
  displayedFeeOptions
}: BaseContentProps<T>) => {
  const { formState } = useFormContext<T>();

  return (
    <>
      <div className="px-4 flex flex-col flex-1 overflow-y-scroll">
        <OneAssetHeader network={network} assetSlug={assetSlug} amount={amount} className="my-4" />

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
          displayedFee={displayedFee}
          displayedStorageFee={displayedStorageFee}
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

      <LedgerApprovalModal state={ledgerApprovalModalState} onClose={onLedgerModalClose} />
    </>
  );
};

import React, { useCallback } from 'react';

import BigNumber from 'bignumber.js';
import { SubmitHandler, useFormContext } from 'react-hook-form';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { Loader } from 'app/atoms';
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
import { EvmChain, OneOfChains } from 'temple/front';
import { AssetsAmounts } from 'temple/types';

interface BaseContentProps<T extends TxParamsFormData> {
  ledgerApprovalModalState: LedgerOperationState;
  onLedgerModalClose: EmptyFn;
  network: OneOfChains;
  nativeAssetSlug: string;
  someBalancesChanges: boolean;
  filteredBalancesChanges: AssetsAmounts[];
  selectedTab: Tab;
  setSelectedTab: SyncFn<Tab>;
  selectedFeeOption: FeeOptionLabel | nullish;
  latestSubmitError: unknown;
  onFeeOptionSelect: SyncFn<FeeOptionLabel>;
  onSubmit: SubmitHandler<T>;
  onCancel: EmptyFn;
  submitLoadingOverride?: boolean;
  minimumReceived?: {
    amount: string;
    symbol: string;
  };
  bridgeData?: {
    inputNetwork: EvmChain;
    outputNetwork: EvmChain;
    executionTime: string;
    protocolFee?: string;
    destinationChainGasTokenAmount?: BigNumber;
  };
  cashbackInTkey?: string;
  displayedFee?: string;
  displayedStorageFee?: string;
  displayedFeeOptions?: DisplayedFeeOptions;
  submitDisabled?: boolean;
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
  submitLoadingOverride,
  minimumReceived,
  cashbackInTkey,
  displayedFee,
  displayedStorageFee,
  displayedFeeOptions,
  bridgeData,
  submitDisabled
}: BaseContentProps<T>) => {
  const { formState } = useFormContext<T>();

  const goToFeeTab = useCallback(() => setSelectedTab('fee'), [setSelectedTab]);

  return (
    <>
      <div className="px-4 flex flex-col flex-1 overflow-y-scroll">
        <div className="my-4">
          {someBalancesChanges ? (
            <FadeTransition>
              <BalancesChangesView
                balancesChanges={filteredBalancesChanges}
                chain={network}
                bridgeData={bridgeData}
                footer={
                  <FeeSummary
                    network={network}
                    assetSlug={nativeAssetSlug}
                    gasFee={displayedFee}
                    storageFee={displayedStorageFee}
                    protocolFee={bridgeData?.protocolFee}
                    onOpenFeeTab={goToFeeTab}
                    embedded
                  />
                }
              />
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
          displayedFeeOptions={displayedFeeOptions}
          cashbackInTkey={cashbackInTkey}
          minimumReceived={minimumReceived}
          bridgeData={bridgeData}
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
          loading={submitLoadingOverride ?? formState.isSubmitting}
          disabled={!formState.isValid || Boolean(submitDisabled)}
        >
          <T id={latestSubmitError ? 'retry' : 'confirm'} />
        </StyledButton>
      </ActionsButtonsBox>

      <LedgerApprovalModal state={ledgerApprovalModalState} onClose={onLedgerModalClose} chainKind={network.kind} />
    </>
  );
};

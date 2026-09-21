import React, { ReactNode, useCallback, useRef } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';
import { SubmitHandler, useFormContext, useFormState } from 'react-hook-form';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { Loader } from 'app/atoms';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { StyledButton } from 'app/atoms/StyledButton';
import { BalancesChangesView } from 'app/templates/balances-changes-view';
import { CurrentAccount } from 'app/templates/current-account';
import { FeeSummary } from 'app/templates/fee-summary';
import { LedgerApprovalModal } from 'app/templates/ledger-approval-modal';
import { TransactionTabs } from 'app/templates/TransactionTabs';
import { EvmTxParamsFormData, Tab, TxParamsFormData } from 'app/templates/TransactionTabs/types';
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
  readOnlyFees?: boolean;
  feeSymbol?: string;
  retry?: boolean;
  actionsNotice?: ReactNode;
  evmGasPriceOverride?: string;
  evmAdvancedValues?: Partial<EvmTxParamsFormData>;
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
  submitDisabled,
  readOnlyFees,
  feeSymbol,
  retry,
  actionsNotice,
  evmGasPriceOverride,
  evmAdvancedValues
}: BaseContentProps<T>) => {
  const { control } = useFormContext<T>();
  // React Compiler caches `<FormProvider {...form}>` on RHF's stable form, so context consumers stop re-rendering
  const formState = useFormState<T>({ control });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const goToFeeTab = useCallback(() => setSelectedTab('fee'), [setSelectedTab]);
  const actionButtons = (
    <>
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
        <T id={latestSubmitError || retry ? 'retry' : 'confirm'} />
      </StyledButton>
    </>
  );

  return (
    <>
      <div ref={scrollContainerRef} className="px-4 flex flex-col flex-1 overflow-y-scroll">
        <div className="my-4">
          {someBalancesChanges ? (
            <FadeTransition>
              <BalancesChangesView
                balancesChanges={filteredBalancesChanges}
                chain={network}
                bridgeData={bridgeData}
                footer={
                  readOnlyFees && displayedFee === undefined ? (
                    <div className="flex justify-between py-2 text-font-description">
                      <T id="totalFee" />
                      <span>—</span>
                    </div>
                  ) : (
                    <FeeSummary
                      network={network}
                      assetSlug={nativeAssetSlug}
                      gasFee={displayedFee}
                      storageFee={displayedStorageFee}
                      protocolFee={feeSymbol ? undefined : bridgeData?.protocolFee}
                      onOpenFeeTab={goToFeeTab}
                      assetSymbol={feeSymbol}
                      embedded
                    />
                  )
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
          readOnlyFees={readOnlyFees}
          evmGasPriceOverride={evmGasPriceOverride}
          evmAdvancedValues={evmAdvancedValues}
        />
      </div>

      <ActionsButtonsBox
        flexDirection="col"
        shouldChangeBottomShift={false}
        className="gap-0!"
        scrollContainerRef={scrollContainerRef}
      >
        <div
          className={clsx(
            'relative z-0 transition-all duration-300 ease-in-out',
            actionsNotice ? 'h-10 opacity-100' : 'h-0 opacity-0 overflow-hidden pointer-events-none'
          )}
          aria-hidden={!actionsNotice}
        >
          {actionsNotice}
        </div>
        <div className="relative z-1 flex w-full gap-2.5 bg-white">{actionButtons}</div>
      </ActionsButtonsBox>

      <LedgerApprovalModal state={ledgerApprovalModalState} onClose={onLedgerModalClose} chainKind={network.kind} />
    </>
  );
};

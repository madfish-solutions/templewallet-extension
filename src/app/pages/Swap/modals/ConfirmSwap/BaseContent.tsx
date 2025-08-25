import React from 'react';

import BigNumber from 'bignumber.js';
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
import { T } from 'lib/i18n';
import { DisplayedFeeOptions, FeeOptionLabel } from 'lib/temple/front/estimation-data-providers';
import { LedgerOperationState } from 'lib/ui';
import { EvmChain, OneOfChains } from 'temple/front';

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
  quoteRefreshCountdown?: number;
  isQuoteExpired?: boolean;
  isQuoteRefreshing?: boolean;
  onManualQuoteRefresh?: EmptyFn;
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
  cashbackInTkey,
  displayedFee,
  displayedStorageFee,
  displayedFeeOptions,
  bridgeData,
  quoteRefreshCountdown,
  isQuoteExpired,
  isQuoteRefreshing,
  onManualQuoteRefresh
}: BaseContentProps<T>) => {
  const { formState } = useFormContext<T>();

  return (
    <>
      <div className="px-4 flex flex-col flex-1 overflow-y-scroll">
        <div className="my-4">
          {someBalancesChanges ? (
            <FadeTransition>
              <BalancesChangesView balancesChanges={filteredBalancesChanges} chain={network} bridgeData={bridgeData} />
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
          type={onManualQuoteRefresh && isQuoteExpired ? 'button' : 'submit'}
          form={onManualQuoteRefresh && isQuoteExpired ? undefined : 'confirm-form'}
          color="primary"
          size="L"
          className="w-full"
          loading={isQuoteRefreshing || formState.isSubmitting}
          disabled={isQuoteRefreshing === undefined ? !formState.isValid : isQuoteRefreshing}
          onClick={onManualQuoteRefresh && isQuoteExpired ? onManualQuoteRefresh : undefined}
        >
          {latestSubmitError ? (
            <T id="retry" />
          ) : isQuoteRefreshing ? null : isQuoteExpired ? (
            <T id="refresh" />
          ) : (
            <T id="confirmWithCountdown" substitutions={[quoteRefreshCountdown]} />
          )}
        </StyledButton>
      </ActionsButtonsBox>

      <LedgerApprovalModal state={ledgerApprovalModalState} onClose={onLedgerModalClose} />
    </>
  );
};

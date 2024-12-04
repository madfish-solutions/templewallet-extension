import React, { useCallback, useRef } from 'react';

import { SubmitHandler, useFormContext } from 'react-hook-form-v7';

import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import SegmentedControl from 'app/atoms/SegmentedControl';
import Spinner from 'app/atoms/Spinner/Spinner';
import { StyledButton } from 'app/atoms/StyledButton';
import { T } from 'lib/i18n';
import { OneOfChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { CurrentAccount } from './components/CurrentAccount';
import { Header } from './components/Header';
import { AdvancedTab } from './tabs/Advanced';
import { DetailsTab } from './tabs/Details';
import { ErrorTab } from './tabs/Error';
import { FeeTab } from './tabs/Fee';
import { DisplayedFeeOptions, FeeOptionLabel, TxParamsFormData } from './types';

export type Tab = 'details' | 'fee' | 'advanced' | 'error';

interface BaseContentProps<T extends TxParamsFormData> {
  network: OneOfChains;
  assetSlug: string;
  amount: string;
  recipientAddress: string;
  selectedTab: Tab;
  setSelectedTab: SyncFn<Tab>;
  selectedFeeOption: FeeOptionLabel | nullish;
  latestSubmitError: string | nullish;
  onFeeOptionSelect: SyncFn<FeeOptionLabel>;
  onSubmit: SubmitHandler<T>;
  onCancel: EmptyFn;
  displayedFee?: string;
  displayedStorageFee?: string;
  displayedFeeOptions?: DisplayedFeeOptions;
}

export const BaseContent = <T extends TxParamsFormData>({
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
  displayedFee,
  displayedStorageFee,
  displayedFeeOptions
}: BaseContentProps<T>) => {
  const { handleSubmit, formState } = useFormContext<T>();

  const errorTabRef = useRef<HTMLDivElement>(null);

  const goToFeeTab = useCallback(() => setSelectedTab('fee'), [setSelectedTab]);

  const isEvm = network.kind === TempleChainKind.EVM;

  return (
    <>
      <div className="px-4 flex flex-col flex-1 overflow-y-scroll">
        <Header network={network} assetSlug={assetSlug} amount={amount} />

        <CurrentAccount />

        <SegmentedControl<Tab>
          name="confirm-send-tabs"
          activeSegment={selectedTab}
          setActiveSegment={setSelectedTab}
          controlRef={useRef<HTMLDivElement>(null)}
          className="mt-6 mb-4"
          segments={[
            {
              label: 'Details',
              value: 'details',
              ref: useRef<HTMLDivElement>(null)
            },
            {
              label: 'Fee',
              value: 'fee',
              ref: useRef<HTMLDivElement>(null)
            },
            {
              label: 'Advanced',
              value: 'advanced',
              ref: useRef<HTMLDivElement>(null)
            },
            ...(latestSubmitError
              ? [
                  {
                    label: 'Error',
                    value: 'error' as Tab,
                    ref: errorTabRef
                  }
                ]
              : [])
          ]}
        />

        <form id="confirm-form" className="flex-1 flex flex-col" onSubmit={handleSubmit(onSubmit)}>
          {displayedFeeOptions ? (
            (() => {
              switch (selectedTab) {
                case 'fee':
                  return (
                    <FeeTab
                      network={network}
                      assetSlug={assetSlug}
                      displayedFeeOptions={displayedFeeOptions}
                      selectedOption={selectedFeeOption}
                      onOptionSelect={onFeeOptionSelect}
                    />
                  );
                case 'advanced':
                  return <AdvancedTab isEvm={isEvm} />;
                case 'error':
                  return <ErrorTab isEvm={isEvm} message={latestSubmitError} />;
                default:
                  return (
                    <DetailsTab
                      network={network}
                      assetSlug={assetSlug}
                      recipientAddress={recipientAddress}
                      displayedFee={displayedFee}
                      displayedStorageFee={displayedStorageFee}
                      goToFeeTab={goToFeeTab}
                    />
                  );
              }
            })()
          ) : (
            <div className="flex justify-center my-10">
              <Spinner theme="gray" className="w-20" />
            </div>
          )}
        </form>
      </div>

      <ActionsButtonsBox shouldChangeBottomShift={false}>
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
    </>
  );
};

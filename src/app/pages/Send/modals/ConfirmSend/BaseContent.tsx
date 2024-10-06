import React, { useCallback, useRef, useState } from 'react';

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
import { DisplayedFeeOptions, FeeOptionLabel, TxParamsFormData } from './interfaces';
import { AdvancedTab } from './tabs/Advanced';
import { DetailsTab } from './tabs/Details';
import { FeeTab } from './tabs/Fee';

interface BaseContentProps<T extends TxParamsFormData> {
  network: OneOfChains;
  assetSlug: string;
  amount: string;
  recipientAddress: string;
  selectedFeeOption: FeeOptionLabel | nullish;
  onFeeOptionSelect: (label: FeeOptionLabel) => void;
  onSubmit: SubmitHandler<T>;
  onCancel: EmptyFn;
  displayedFee?: string;
  displayedStorageLimit?: string;
  displayedFeeOptions?: DisplayedFeeOptions;
}

export const BaseContent = <T extends TxParamsFormData>({
  network,
  assetSlug,
  recipientAddress,
  amount,
  selectedFeeOption,
  onFeeOptionSelect,
  onSubmit,
  onCancel,
  displayedFee,
  displayedStorageLimit,
  displayedFeeOptions
}: BaseContentProps<T>) => {
  const { handleSubmit, formState } = useFormContext<T>();

  const [tab, setTab] = useState('details');

  const activeIndexRef = useRef<number | null>(null);

  const goToFeeTab = useCallback(() => {
    activeIndexRef.current = 1;
    setTab('fee');
  }, []);

  return (
    <>
      <div className="px-4 flex flex-col flex-1 overflow-y-scroll">
        <Header network={network} assetSlug={assetSlug} amount={amount} />

        <CurrentAccount />

        <SegmentedControl
          name="confirm-send-tabs"
          setActiveSegment={val => setTab(val)}
          controlRef={useRef<HTMLDivElement>(null)}
          activeIndexRef={activeIndexRef}
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
            }
          ]}
        />

        <form id="confirm-form" className="flex-1 flex flex-col" onSubmit={handleSubmit(onSubmit)}>
          {displayedFeeOptions ? (
            (() => {
              switch (tab) {
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
                  return <AdvancedTab isEvm={network.kind === TempleChainKind.EVM} />;
                default:
                  return (
                    <DetailsTab
                      network={network}
                      assetSlug={assetSlug}
                      recipientAddress={recipientAddress}
                      displayedFee={displayedFee}
                      displayedStorageLimit={displayedStorageLimit}
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
      <ActionsButtonsBox flexDirection="row" className="gap-x-2.5" shouldChangeBottomShift={false}>
        <StyledButton size="L" className="w-full" color="primary-low" onClick={onCancel}>
          <T id="cancel" />
        </StyledButton>

        <StyledButton
          type="submit"
          form="confirm-form"
          color="primary"
          size="L"
          className="w-full"
          disabled={formState.isSubmitting}
        >
          <T id="confirm" />
        </StyledButton>
      </ActionsButtonsBox>
    </>
  );
};
import React, { FC, useMemo } from 'react';

import clsx from 'clsx';
import { Controller, useFormContext } from 'react-hook-form-v7';
import { formatEther } from 'viem';

import { FadeTransition } from 'app/a11y/FadeTransition';
import AssetField from 'app/atoms/AssetField';
import { t, T } from 'lib/i18n';
import { useTezosGasMetadata } from 'lib/metadata';
import {
  DisplayedFeeOptions,
  FeeOptionLabel,
  useEvmEstimationDataState,
  useTezosEstimationDataState
} from 'lib/temple/front/estimation-data-providers';
import { OneOfChains } from 'temple/front';
import { ChainOfKind } from 'temple/front/chains';
import { DEFAULT_EVM_CURRENCY } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

import { FeeOptions } from '../components/fee-options';
import { EvmTxParamsFormData, TezosTxParamsFormData } from '../types';
import { getTezosFeeOption, validateNonZero } from '../utils';

interface FeeTabProps {
  network: OneOfChains;
  assetSlug: string;
  displayedFeeOptions?: DisplayedFeeOptions;
  selectedOption: FeeOptionLabel | nullish;
  onOptionSelect: (label: FeeOptionLabel) => void;
}

export const FeeTab: FC<FeeTabProps> = ({
  network,
  assetSlug,
  displayedFeeOptions,
  selectedOption,
  onOptionSelect
}) => (
  <FadeTransition>
    {displayedFeeOptions && (
      <FeeOptions
        network={network}
        activeOptionName={selectedOption}
        assetSlug={assetSlug}
        displayedFeeOptions={displayedFeeOptions}
        onOptionClick={onOptionSelect}
      />
    )}
    {network.kind === TempleChainKind.EVM ? (
      <EvmContent selectedOption={selectedOption} network={network} onOptionSelect={onOptionSelect} />
    ) : (
      <TezosContent selectedOption={selectedOption} network={network} onOptionSelect={onOptionSelect} />
    )}
  </FadeTransition>
);

type ContentProps<T extends TempleChainKind> = Pick<FeeTabProps, 'selectedOption' | 'onOptionSelect'> & {
  network: ChainOfKind<T>;
};

const EvmContent: FC<ContentProps<TempleChainKind.EVM>> = ({ selectedOption, onOptionSelect }) => {
  const { control } = useFormContext<EvmTxParamsFormData>();
  const { data } = useEvmEstimationDataState();

  const gasPriceFallback = useMemo(() => {
    if (!data || !selectedOption) return '';

    return formatEther(
      data.feeOptions.type === 'legacy'
        ? data.feeOptions.gasPrice[selectedOption].gasPrice
        : data.feeOptions.gasPrice[selectedOption].maxFeePerGas,
      'gwei'
    );
  }, [data, selectedOption]);

  return (
    <>
      <OptionalFieldLabel title={t('gasPrice')} className="mt-4" />

      <Controller
        name="gasPrice"
        control={control}
        rules={{ validate: v => validateNonZero(v, t('gasPrice')) }}
        render={({ field: { value, onChange, onBlur }, formState: { errors } }) => (
          <AssetField
            value={value || gasPriceFallback}
            placeholder="1.0"
            min={0}
            assetDecimals={DEFAULT_EVM_CURRENCY.decimals}
            rightSideComponent={<div className="text-font-description-bold text-grey-2">GWEI</div>}
            onChange={v => onChange(v ?? '')}
            onBlur={() => {
              if (!value) onOptionSelect('mid');
              onBlur();
            }}
            errorCaption={errors.gasPrice?.message}
            containerClassName="mb-7"
          />
        )}
      />
    </>
  );
};

const TezosContent: FC<ContentProps<TempleChainKind.Tezos>> = ({ network, selectedOption, onOptionSelect }) => {
  const { control, formState } = useFormContext<TezosTxParamsFormData>();
  const { data } = useTezosEstimationDataState();
  const { decimals: gasDecimals, symbol: gasSymbol } = useTezosGasMetadata(network.chainId);

  const gasFeeFallback = useMemo(() => {
    if (!data || !selectedOption) return '';

    return getTezosFeeOption(selectedOption, data.gasFee);
  }, [data, selectedOption]);

  const gasFeeError = formState.errors.gasFee?.message;

  const defaultStorageLimit = useMemo(
    () => data?.estimates.reduce((acc, { storageLimit }) => acc + storageLimit, 0),
    [data?.estimates]
  );

  return (
    <>
      <OptionalFieldLabel title={t('gasFee')} className="mt-4" />

      <Controller
        name="gasFee"
        control={control}
        rules={{ validate: v => validateNonZero(v, t('gasFee')) }}
        render={({ field: { value, onChange, onBlur } }) => (
          <AssetField
            value={value || gasFeeFallback}
            placeholder="1.0"
            min={0}
            assetDecimals={gasDecimals}
            rightSideComponent={<div className="text-font-description-bold text-grey-2">{gasSymbol}</div>}
            onChange={v => onChange(v ?? '')}
            onBlur={() => {
              if (!value) onOptionSelect('mid');
              onBlur();
            }}
            errorCaption={gasFeeError}
            containerClassName="mb-3"
          />
        )}
      />

      <OptionalFieldLabel title="Storage Limit" />

      <Controller
        name="storageLimit"
        control={control}
        render={({ field: { value, onChange, onBlur } }) => (
          <AssetField
            value={value || defaultStorageLimit}
            placeholder="0"
            min={0}
            onlyInteger
            onChange={v => onChange(v ?? '')}
            onBlur={onBlur}
          />
        )}
      />
    </>
  );
};

interface OptionalFieldLabelProps {
  title: string;
  className?: string;
}

const OptionalFieldLabel: FC<OptionalFieldLabelProps> = ({ title, className }) => (
  <div className={clsx('mb-1 flex flex-row justify-between items-center', className)}>
    <p className="text-font-description-bold">{title}</p>
    <p className="text-grey-2 text-font-description">
      <T id="optional" />
    </p>
  </div>
);

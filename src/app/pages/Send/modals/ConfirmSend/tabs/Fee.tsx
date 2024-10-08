import React, { FC, useMemo } from 'react';

import { Controller, useFormContext } from 'react-hook-form-v7';
import { formatEther } from 'viem';

import AssetField from 'app/atoms/AssetField';
import { t, T } from 'lib/i18n';
import { OneOfChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { useEvmEstimationDataState } from '../context';
import { DisplayedFeeOptions, EvmTxParamsFormData, FeeOptionLabel, TezosTxParamsFormData } from '../interfaces';
import { validateNonZero } from '../utils';

import { FeeOptions } from './components/FeeOptions';

interface FeeTabProps {
  network: OneOfChains;
  assetSlug: string;
  displayedFeeOptions: DisplayedFeeOptions;
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
  <>
    <FeeOptions
      network={network}
      activeOptionName={selectedOption}
      assetSlug={assetSlug}
      displayedFeeOptions={displayedFeeOptions}
      onOptionClick={onOptionSelect}
    />
    {network.kind === TempleChainKind.EVM ? (
      <EvmContent selectedOption={selectedOption} onOptionSelect={onOptionSelect} />
    ) : (
      <TezosContent onOptionSelect={onOptionSelect} />
    )}
  </>
);

const EvmContent: FC<Pick<FeeTabProps, 'selectedOption' | 'onOptionSelect'>> = ({ selectedOption, onOptionSelect }) => {
  const { control } = useFormContext<EvmTxParamsFormData>();
  const { data } = useEvmEstimationDataState();

  const gasPriceFallback = useMemo(() => {
    if (!data || !selectedOption) return '';

    return formatEther(data.feeOptions.gasPrice[selectedOption].maxFeePerGas, 'gwei');
  }, [data, selectedOption]);

  return (
    <>
      <div className="mt-4 mb-1 px-1 flex flex-row justify-between items-center">
        <p className="text-font-description-bold">
          <T id="gasPrice" />
        </p>
        <p className="text-grey-2 text-font-description">
          <T id="optional" />
        </p>
      </div>

      <Controller
        name="gasPrice"
        control={control}
        rules={{ validate: v => validateNonZero(v, t('gasPrice')) }}
        render={({ field: { value, onChange, onBlur }, formState: { errors } }) => (
          <AssetField
            value={value || gasPriceFallback}
            placeholder="1.0"
            min={0}
            assetDecimals={18}
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

const TezosContent: FC<Pick<FeeTabProps, 'onOptionSelect'>> = ({ onOptionSelect }) => {
  const { control } = useFormContext<TezosTxParamsFormData>();

  return (
    <>
      <div className="mt-4 mb-1 px-1 flex flex-row justify-between items-center">
        <p className="text-font-description-bold">
          <T id="gasFee" />
        </p>
        <p className="text-grey-2 text-font-description">
          <T id="optional" />
        </p>
      </div>

      <Controller
        name="gasFee"
        control={control}
        render={({ field: { value, onChange, onBlur } }) => (
          <AssetField
            value={value}
            placeholder="1.0"
            min={0}
            assetDecimals={6}
            rightSideComponent={<div className="text-font-description-bold text-grey-2">TEZ</div>}
            onChange={onChange}
            onBlur={() => {
              if (!value) onOptionSelect('mid');
              onBlur();
            }}
          />
        )}
      />

      <div className="mt-3 mb-1 px-1 flex flex-row justify-between items-center">
        <p className="text-font-description-bold">Storage Limit</p>
        <p className="text-grey-2 text-font-description">
          <T id="optional" />
        </p>
      </div>

      <Controller
        name="storageLimit"
        control={control}
        render={({ field }) => (
          <AssetField
            placeholder="0.00"
            min={0}
            assetDecimals={6}
            rightSideComponent={<div className="text-font-description-bold text-grey-2">TEZ</div>}
            {...field}
          />
        )}
      />
    </>
  );
};

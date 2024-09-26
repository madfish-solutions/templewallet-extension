import React, { FC, useCallback, useMemo } from 'react';

import { formatEther, parseEther } from 'viem';

import { FormField } from 'app/atoms';
import { T } from 'lib/i18n';
import { getGasPriceStep } from 'temple/evm/utils';

import type { EstimationData, ModifiableEstimationData } from '../index';

import { FeeOptions, OptionLabel } from './components/FeeOptions';

interface Props {
  chainAssetSlug: string;
  estimationData: EstimationData;
  selectedOption: OptionLabel;
  onOptionSelect: (label: OptionLabel, option: ModifiableEstimationData) => void;
}

export const FeeTab: FC<Props> = ({ chainAssetSlug, estimationData, selectedOption, onOptionSelect }) => {
  const { maxFeePerGas, gas, maxPriorityFeePerGas } = estimationData;

  const gasPriceOptions = useMemo(() => {
    const maxFeeStep = getGasPriceStep(maxFeePerGas);
    const maxPriorityFeeStep = getGasPriceStep(maxPriorityFeePerGas);

    return {
      slow: {
        maxFeePerGas: maxFeePerGas - maxFeeStep,
        maxPriorityFeePerGas: maxPriorityFeePerGas - maxPriorityFeeStep
      },
      mid: { maxFeePerGas: maxFeePerGas, maxPriorityFeePerGas },
      fast: { maxFeePerGas: maxFeePerGas + maxFeeStep, maxPriorityFeePerGas: maxPriorityFeePerGas + maxPriorityFeeStep }
    };
  }, [maxFeePerGas, maxPriorityFeePerGas]);

  const estimatedFeeOptions = useMemo(
    () => ({
      slow: formatEther(gas * gasPriceOptions.slow.maxFeePerGas),
      mid: formatEther(gas * gasPriceOptions.mid.maxFeePerGas),
      fast: formatEther(gas * gasPriceOptions.fast.maxFeePerGas)
    }),
    [gas, gasPriceOptions.fast.maxFeePerGas, gasPriceOptions.mid.maxFeePerGas, gasPriceOptions.slow.maxFeePerGas]
  );

  const handleOptionClick = useCallback(
    (option: OptionLabel) =>
      void onOptionSelect(option, {
        estimatedFee: parseEther(estimatedFeeOptions[option]),
        ...gasPriceOptions[option]
      }),
    [estimatedFeeOptions, gasPriceOptions, onOptionSelect]
  );

  return (
    <>
      <FeeOptions
        chainAssetSlug={chainAssetSlug}
        activeOptionName={selectedOption}
        estimatedFeeOptions={estimatedFeeOptions}
        onOptionClick={handleOptionClick}
      />

      <div className="mt-4 mb-1 px-1 flex flex-row justify-between items-center">
        <p className="text-font-description-bold">Gas Price</p>
        <p className="text-grey-2 text-font-description">
          <T id="optional" />
        </p>
      </div>

      <FormField
        type="number"
        name="gas-price"
        id="gas-price"
        placeholder="1.0"
        rightSideComponent={<div className="text-font-description-bold text-grey-2">GWEI</div>}
      />
    </>
  );
};

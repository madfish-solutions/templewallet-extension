import React, { FC, useCallback, useMemo, useState } from 'react';

import { formatEther } from 'viem';

import { FormField } from 'app/atoms';
import { T } from 'lib/i18n';
import { getGasPriceStep } from 'temple/evm/utils';

import type { EstimationData } from '../index';

import { FeeOptions, OptionLabel } from './components/FeeOptions';

interface Props {
  chainAssetSlug: string;
  estimationData: EstimationData;
  onOptionSelect: (option: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }) => void;
}

export const FeeTab: FC<Props> = ({ chainAssetSlug, estimationData, onOptionSelect }) => {
  const [selectedOption, setSelectedOption] = useState<OptionLabel>('mid');

  const { maxFeePerGas: averageGasPrice, gas, maxPriorityFeePerGas } = estimationData;

  const gasPriceOptions = useMemo(() => {
    const step = getGasPriceStep(averageGasPrice);

    return {
      slow: { maxFeePerGas: averageGasPrice - step, maxPriorityFeePerGas: maxPriorityFeePerGas - step },
      mid: { maxFeePerGas: averageGasPrice, maxPriorityFeePerGas },
      fast: { maxFeePerGas: averageGasPrice + step, maxPriorityFeePerGas: maxPriorityFeePerGas + step }
    };
  }, [averageGasPrice, maxPriorityFeePerGas]);

  const estimatedFeeOptions = useMemo(
    () => ({
      slow: formatEther(gas * gasPriceOptions.slow.maxFeePerGas),
      mid: formatEther(gas * gasPriceOptions.mid.maxFeePerGas),
      fast: formatEther(gas * gasPriceOptions.fast.maxFeePerGas)
    }),
    [gas, gasPriceOptions.fast.maxFeePerGas, gasPriceOptions.mid.maxFeePerGas, gasPriceOptions.slow.maxFeePerGas]
  );

  const handleOptionClick = useCallback(
    (option: OptionLabel) => {
      setSelectedOption(option);
      onOptionSelect(gasPriceOptions[option]);
    },
    [gasPriceOptions, onOptionSelect]
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

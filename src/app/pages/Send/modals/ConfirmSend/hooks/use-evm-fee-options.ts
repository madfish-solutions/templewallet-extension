import { useDebounce } from 'use-debounce';
import { formatEther } from 'viem';

import { EvmEstimationData } from 'app/pages/Send/hooks/use-evm-estimation-data';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { getGasPriceStep } from 'temple/evm/utils';

import { DisplayedFeeOptions, EvmFeeOptions } from '../interfaces';

export const useEvmFeeOptions = (customGasLimit: string, estimationData?: EvmEstimationData): EvmFeeOptions | null => {
  const [debouncedCustomGasLimit] = useDebounce(customGasLimit, 500);

  return useMemoWithCompare(() => {
    if (!estimationData) return null;

    const { maxFeePerGas, gas: estimatedGasLimit, maxPriorityFeePerGas } = estimationData;

    const gas = debouncedCustomGasLimit ? BigInt(debouncedCustomGasLimit) : estimatedGasLimit;

    const maxFeeStep = getGasPriceStep(maxFeePerGas);
    const maxPriorityFeeStep = getGasPriceStep(maxPriorityFeePerGas);

    const gasPrice = {
      slow: {
        maxFeePerGas: maxFeePerGas - maxFeeStep,
        maxPriorityFeePerGas: maxPriorityFeePerGas - maxPriorityFeeStep
      },
      mid: { maxFeePerGas: maxFeePerGas, maxPriorityFeePerGas },
      fast: { maxFeePerGas: maxFeePerGas + maxFeeStep, maxPriorityFeePerGas: maxPriorityFeePerGas + maxPriorityFeeStep }
    };

    const displayed: DisplayedFeeOptions = {
      slow: formatEther(gas * gasPrice.slow.maxFeePerGas),
      mid: formatEther(gas * gasPrice.mid.maxFeePerGas),
      fast: formatEther(gas * gasPrice.fast.maxFeePerGas)
    };

    return { displayed, gasPrice };
  }, [estimationData, debouncedCustomGasLimit]);
};

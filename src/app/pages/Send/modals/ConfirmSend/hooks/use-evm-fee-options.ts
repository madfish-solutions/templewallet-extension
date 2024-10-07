import { formatEther } from 'viem';

import { useMemoWithCompare } from 'lib/ui/hooks';
import { getGasPriceStep } from 'temple/evm/utils';

import { DisplayedFeeOptions, EvmEstimationData, EvmFeeOptions } from '../interfaces';

export const useEvmFeeOptions = (estimationData?: EvmEstimationData): EvmFeeOptions | null =>
  useMemoWithCompare(() => {
    if (!estimationData) return null;

    const { maxFeePerGas, gas, maxPriorityFeePerGas } = estimationData;

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
  }, [estimationData]);

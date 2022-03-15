import { useMemo } from 'react';

import BigNumber from 'bignumber.js';
import { DeepPartial } from 'react-hook-form';

import { useLocation } from 'lib/woozie';

export interface SwapInputValue {
  assetSlug?: string;
  amount?: BigNumber;
}

export interface SwapFormValue {
  input: SwapInputValue;
  output: SwapInputValue;
  slippageTolerance?: number;
}

const getValidAssetSlug = (queryAssetSlug: string | null) =>
  queryAssetSlug && queryAssetSlug.length > 0 ? queryAssetSlug : undefined;

export const useSwapFormDefaultValue = () => {
  const location = useLocation();

  return useMemo<DeepPartial<SwapFormValue>>(() => {
    const usp = new URLSearchParams(location.search);

    const inputAssetSlug = usp.get('from') || 'tez';
    const outputAssetSlug = usp.get('to');

    return {
      input: { assetSlug: getValidAssetSlug(inputAssetSlug) },
      output: { assetSlug: getValidAssetSlug(outputAssetSlug) },
      slippageTolerance: 1.5
    };
  }, [location.search]);
};

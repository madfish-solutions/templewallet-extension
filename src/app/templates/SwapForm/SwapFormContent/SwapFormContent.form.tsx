import { useMemo } from 'react';

import { DeepPartial } from 'react-hook-form';

import { useLocation } from 'lib/woozie';

import { SwapFormValue } from './SwapFormValue.interface';

const getValidAssetSlug = (queryAssetSlug: string | null) =>
  queryAssetSlug && queryAssetSlug.length > 0 ? queryAssetSlug : undefined;

export const useSwapFormContentDefaultValue = () => {
  const location = useLocation();

  return useMemo<DeepPartial<SwapFormValue>>(() => {
    const usp = new URLSearchParams(location.search);

    const inputAssetSlug = usp.get('from');
    const outputAssetSlug = usp.get('to');

    return {
      input: { assetSlug: getValidAssetSlug(inputAssetSlug) },
      output: { assetSlug: getValidAssetSlug(outputAssetSlug) },
      slippageTolerance: 1
    };
  }, [location.search]);
};

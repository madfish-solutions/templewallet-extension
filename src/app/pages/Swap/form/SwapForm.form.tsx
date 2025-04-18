import { useMemo } from 'react';

import BigNumber from 'bignumber.js';
import { DeepPartial } from 'react-hook-form';

import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useLocation } from 'lib/woozie';

export interface SwapInputValue {
  assetSlug?: string;
  amount?: BigNumber;
}

export interface SwapFormValue {
  input: SwapInputValue;
  output: SwapInputValue;
}

const getValidAssetSlug = (queryAssetSlug: string | null) =>
  queryAssetSlug && queryAssetSlug.length > 0 ? queryAssetSlug : undefined;

const getAssetsSlugsFromUrl = (fromSlug: null | string, toSlug: null | string) => {
  if (!fromSlug && !toSlug) {
    return {
      fromSlug: TEZ_TOKEN_SLUG,
      toSlug
    };
  }

  return {
    fromSlug,
    toSlug
  };
};

export const useSwapFormDefaultValue = () => {
  const location = useLocation();

  return useMemo<DeepPartial<SwapFormValue>>(() => {
    const usp = new URLSearchParams(location.search);

    const { fromSlug, toSlug } = getAssetsSlugsFromUrl(usp.get('from'), usp.get('to'));

    return {
      input: { assetSlug: getValidAssetSlug(fromSlug) },
      output: { assetSlug: getValidAssetSlug(toSlug) }
    };
  }, [location.search]);
};

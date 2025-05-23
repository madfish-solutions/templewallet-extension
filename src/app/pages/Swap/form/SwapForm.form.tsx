import { useMemo } from 'react';

import BigNumber from 'bignumber.js';
import { DeepPartial } from 'react-hook-form';

import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useLocation } from 'lib/woozie';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';

export interface SwapInputValue {
  assetSlug?: string;
  amount?: BigNumber;
}

export interface SwapFormValue {
  input: SwapInputValue;
  output: SwapInputValue;
  isFiatMode: boolean;
}

const getValidAssetSlug = (queryAssetSlug: string | null) =>
  queryAssetSlug && queryAssetSlug.length > 0 ? queryAssetSlug : undefined;

const getAssetsSlugsFromUrl = (evm: boolean, fromSlug: null | string, toSlug: null | string) => {
  if (!fromSlug && !toSlug) {
    return {
      fromSlug: evm ? EVM_TOKEN_SLUG : TEZ_TOKEN_SLUG,
      toSlug
    };
  }

  return {
    fromSlug,
    toSlug
  };
};

export const useSwapFormDefaultValue = ({ evm }: { evm: boolean }) => {
  const location = useLocation();

  return useMemo<DeepPartial<SwapFormValue>>(() => {
    const usp = new URLSearchParams(location.search);

    const { fromSlug, toSlug } = getAssetsSlugsFromUrl(evm, usp.get('from'), usp.get('to'));
    console.log('useSwapFormDefaultValue', fromSlug, toSlug);

    return {
      input: { assetSlug: getValidAssetSlug(fromSlug) },
      output: { assetSlug: getValidAssetSlug(toSlug) },
      isFiatMode: false
    };
  }, [evm, location.search]);
};

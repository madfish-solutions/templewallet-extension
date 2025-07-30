import { SwapFormValue } from 'app/pages/Swap/form/SwapForm.form';
import { FilterChain } from 'app/store/assets-filter-options/state';

export function getDefaultSwapFormValues(sourceAssetSlug?: string, targetAssetSlug?: string): SwapFormValue {
  return {
    input: {
      assetSlug: sourceAssetSlug
    },
    output: {
      assetSlug: targetAssetSlug
    },
    isFiatMode: false
  };
}

export function isFilterChain(chain: FilterChain | string): chain is FilterChain {
  return typeof chain !== 'string';
}

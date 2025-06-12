import { SwapFormValue } from 'app/pages/Swap/form/SwapForm.form';

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

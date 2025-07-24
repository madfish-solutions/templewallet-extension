import { ChainAssetInfo } from 'app/pages/Swap/form/interfaces';
import { SwapFormValue } from 'app/pages/Swap/form/SwapForm.form';

export function getDefaultSwapFormValues(
  sourceAssetInfo: ChainAssetInfo | null,
  targetAssetInfo?: ChainAssetInfo | null
): SwapFormValue {
  return {
    input: {
      assetSlug: sourceAssetInfo?.assetSlug,
      chainId: sourceAssetInfo?.chainId
    },
    output: {
      assetSlug: targetAssetInfo?.assetSlug,
      chainId: targetAssetInfo?.chainId
    },
    isFiatMode: false
  };
}

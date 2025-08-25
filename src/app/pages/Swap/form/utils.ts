import { ChainAssetInfo } from 'app/pages/Swap/form/interfaces';
import { SwapFormValue } from 'app/pages/Swap/form/SwapForm.form';
import { FilterChain } from 'app/store/assets-filter-options/state';

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

export function getBufferedExecutionDuration(seconds?: number, minDuration = 30): number {
  return Math.max(seconds ?? 0, minDuration);
}

export function formatDuration(seconds: number): string {
  const totalSeconds = Math.max(seconds, 60);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    if (minutes === 0) {
      return hours === 1 ? '1 hour' : `${hours} hours`;
    }
    return `${hours}:${minutes.toString().padStart(2, '0')} hour`;
  }

  if (minutes > 0) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')} min`;
  }

  return `${remainingSeconds} sec`;
}

export function isFilterChain(chain: FilterChain | string): chain is FilterChain {
  return typeof chain !== 'string';
}

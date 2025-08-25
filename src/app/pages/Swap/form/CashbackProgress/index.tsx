import React, { memo, useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { useUserTestingGroupNameSelector } from 'app/store/ab-testing/selectors';
import { ABTestGroup } from 'lib/apis/temple';
import { toLocalFixed } from 'lib/i18n';
import { SWAP_CASHBACK_RATIO, SWAP_THRESHOLD_TO_GET_CASHBACK } from 'lib/route3/constants';

interface Props {
  isEvmNetwork: boolean;
  inputAmountInUSD: BigNumber;
  templeAssetPrice?: BigNumber;
}

export const CashbackProgress = memo<Props>(({ isEvmNetwork, inputAmountInUSD, templeAssetPrice }) => {
  const testGroupName = useUserTestingGroupNameSelector();

  const cashbackProgress = useMemo(() => {
    const threshold = new BigNumber(SWAP_THRESHOLD_TO_GET_CASHBACK);

    const show = !isEvmNetwork && testGroupName === ABTestGroup.B;
    if (!show) return { show: false } as const;

    const isZero = inputAmountInUSD.lte(0);
    const reached = inputAmountInUSD.gte(threshold);
    const remaining = BigNumber.maximum(threshold.minus(inputAmountInUSD), 0);
    const percent = reached ? 100 : inputAmountInUSD.div(threshold).times(100).toNumber();

    let tkeyText: string | null = null;
    if (reached && templeAssetPrice && templeAssetPrice.gt(0)) {
      const estimatedTkey = inputAmountInUSD.times(SWAP_CASHBACK_RATIO).div(templeAssetPrice);
      const display = estimatedTkey.lt(0.01) ? '< 0.01' : toLocalFixed(estimatedTkey, 2);
      tkeyText = `${display} TKEY ✓`;
    }

    return {
      show,
      isZero,
      reached,
      remaining,
      percent: Math.max(0, Math.min(100, percent)),
      tkeyText
    } as const;
  }, [inputAmountInUSD, isEvmNetwork, templeAssetPrice, testGroupName]);

  return cashbackProgress.show ? (
    <div className="px-4">
      <div className="flex items-center justify-between text-sm mb-2">
        <div className="flex items-center gap-2">
          <span>🎁</span>
          <span className="font-semibold">Cashback</span>
        </div>
        <div className="text-grey-1">
          {cashbackProgress.isZero && 'Swap over 10$ and get 0.3% back'}
          {!cashbackProgress.isZero &&
            !cashbackProgress.reached &&
            `Only ${toLocalFixed(cashbackProgress.remaining, 2)}$ to go`}
          {cashbackProgress.reached && cashbackProgress.tkeyText}
        </div>
      </div>
      {!cashbackProgress.isZero && (
        <div className="w-full h-1 rounded bg-[#E9E9EB]">
          <div className="h-1 rounded bg-[#FF5B00]" style={{ width: `${cashbackProgress.percent}%` }} />
        </div>
      )}
    </div>
  ) : null;
});

import React, { FC, useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { IconBase } from 'app/atoms';
import { ReactComponent as GiftIcon } from 'app/icons/base/gift.svg';
import { T, t, toLocalFixed } from 'lib/i18n';
import { SWAP_CASHBACK_RATIO, SWAP_THRESHOLD_TO_GET_CASHBACK } from 'lib/route3/constants';

interface Props {
  inputAmountInUSD: BigNumber;
  templeAssetPrice?: BigNumber;
}

export const CashbackProgressBar: FC<Props> = ({ inputAmountInUSD, templeAssetPrice }) => {
  const cashbackProgress = useMemo(() => {
    const threshold = new BigNumber(SWAP_THRESHOLD_TO_GET_CASHBACK);

    const isZero = inputAmountInUSD.lte(0);
    const reached = inputAmountInUSD.gte(threshold);
    const remaining = BigNumber.maximum(threshold.minus(inputAmountInUSD), 0);
    const percent = reached ? 100 : inputAmountInUSD.div(threshold).times(100).toNumber();

    let displayEstimatedTkey = '';
    if (reached && templeAssetPrice && templeAssetPrice.gt(0)) {
      const estimatedTkey = inputAmountInUSD.times(SWAP_CASHBACK_RATIO).div(templeAssetPrice);
      displayEstimatedTkey = estimatedTkey.lt(0.01) ? '< 0.01' : toLocalFixed(estimatedTkey, 2);
    }

    return {
      isZero,
      reached,
      remaining,
      percent: Math.max(0, Math.min(100, percent)),
      displayEstimatedTkey
    } as const;
  }, [inputAmountInUSD, templeAssetPrice]);

  return (
    <div className="pt-4 px-4 bg-white">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center">
          <IconBase Icon={GiftIcon} className="text-primary" />
          <span className="text-font-description-bold">
            <T id="swapCashback" />
          </span>
        </div>
        <div className="text-font-description text-grey-1">
          {cashbackProgress.isZero && t('swapCashbackDescriptionShort', String(SWAP_CASHBACK_RATIO * 100))}
          {!cashbackProgress.isZero &&
            !cashbackProgress.reached &&
            `Only ${toLocalFixed(cashbackProgress.remaining, 2)}$ to go`}
          {cashbackProgress.reached && (
            <div className="flex items-center">
              <span>{cashbackProgress.displayEstimatedTkey + 'TKEY ✓'}</span>
            </div>
          )}
        </div>
      </div>

      <div className="w-full h-1 rounded bg-lines">
        <div className="h-1 rounded bg-primary" style={{ width: `${cashbackProgress.percent}%` }} />
      </div>
    </div>
  );
};

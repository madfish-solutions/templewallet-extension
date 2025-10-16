import React, { FC, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';

import { ReactComponent as GradientGiftIcon } from 'app/icons/gradient-gift.svg';
import { T, t, toLocalFixed } from 'lib/i18n';
import { SWAP_CASHBACK_RATIO, SWAP_THRESHOLD_TO_GET_CASHBACK, TEMPLE_TOKEN } from 'lib/route3/constants';
import { Lottie } from 'lib/ui/react-lottie';

import SuccessAnimation from './success-animation.json';

const SUCCESS_ANIMATION_OPTIONS = {
  loop: false,
  autoplay: true,
  animationData: SuccessAnimation,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice'
  }
} as const;

const TRANSITION_CLASSNAMES = 'transition-all duration-300 ease-in-out';
const HIDDEN_OFFSCREEN_CLASSNAMES = 'h-0 opacity-0 overflow-hidden pointer-events-none';

const CASHBACK_DISPLAY_AMOUNT_THRESHOLD = 0.01;

interface Props {
  visible: boolean;
  inputAmountInUSD: BigNumber;
  templeAssetPriceInUSD: BigNumber;
}

export const CashbackProgressBar: FC<Props> = ({ visible, inputAmountInUSD, templeAssetPriceInUSD }) => {
  const cashbackProgress = useMemo(() => {
    const threshold = new BigNumber(SWAP_THRESHOLD_TO_GET_CASHBACK);

    const isZero = inputAmountInUSD.lte(0);
    const reached = inputAmountInUSD.decimalPlaces(2, BigNumber.ROUND_CEIL).gte(threshold);
    const remaining = BigNumber.maximum(threshold.minus(inputAmountInUSD), 0);
    const percent = reached ? 100 : inputAmountInUSD.div(threshold).times(100).toNumber();

    let displayEstimatedTkey = '';
    if (reached && templeAssetPriceInUSD.gt(0)) {
      const estimatedTkey = inputAmountInUSD.times(SWAP_CASHBACK_RATIO).div(templeAssetPriceInUSD);
      displayEstimatedTkey = estimatedTkey.lt(CASHBACK_DISPLAY_AMOUNT_THRESHOLD)
        ? `< ${toLocalFixed(CASHBACK_DISPLAY_AMOUNT_THRESHOLD, 2)}`
        : toLocalFixed(estimatedTkey, 2);
    }

    return {
      isZero,
      reached,
      remaining,
      percent: Math.max(0, Math.min(100, percent)),
      displayEstimatedTkey
    } as const;
  }, [inputAmountInUSD, templeAssetPriceInUSD]);

  return (
    <div
      className={clsx(
        'pt-4 px-5 bg-white',
        TRANSITION_CLASSNAMES,
        visible ? 'h-12 opacity-100' : HIDDEN_OFFSCREEN_CLASSNAMES
      )}
      aria-hidden={!visible}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center">
          <GradientGiftIcon className="w-6 h-6" />
          <span className="text-font-description-bold">
            <T id="swapCashback" />
          </span>
        </div>
        <div className="text-font-description text-grey-1">
          {cashbackProgress.isZero && t('swapCashbackDescriptionShort', String(SWAP_CASHBACK_RATIO * 100))}
          {!cashbackProgress.isZero &&
            !cashbackProgress.reached &&
            t('onlyDollarAmountToGo', toLocalFixed(cashbackProgress.remaining, 2))}
          {cashbackProgress.reached && (
            <div className="flex items-center gap-x-0.5">
              <span className="text-font-num-bold-12 text-text">{`${cashbackProgress.displayEstimatedTkey} ${TEMPLE_TOKEN.symbol}`}</span>
              <Lottie
                isClickToPauseDisabled
                options={SUCCESS_ANIMATION_OPTIONS}
                height={16}
                width={16}
                style={{ margin: 0, cursor: 'default' }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="w-full h-1 rounded bg-lines">
        <div
          className="h-1 rounded bg-[linear-gradient(136deg,#FF5B00_-2.06%,#F4BE38_103.52%)]"
          style={{
            width: `${cashbackProgress.percent}%`,
            transition: 'width 600ms cubic-bezier(0.22, 1, 0.36, 1)',
            willChange: 'width'
          }}
        />
      </div>
    </div>
  );
};

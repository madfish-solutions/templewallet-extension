import React from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';

import { IconBase } from 'app/atoms';
import { ReactComponent as ArrowDownIcon } from 'app/icons/base/arrow_down.svg';
import { ReactComponent as ChevronUpIcon } from 'app/icons/base/chevron_up.svg';
import { ReactComponent as GiftIcon } from 'app/icons/base/gift.svg';
import { ReactComponent as RouteIcon } from 'app/icons/base/route.svg';
import { ReactComponent as StackIcon } from 'app/icons/base/stack.svg';
import { ListBlockItem } from 'app/pages/Swap/form/SwapInfoDropdown/ListBlockItem';
import { getPluralKey, T } from 'lib/i18n';
import { ROUTING_FEE_RATIO, SWAP_CASHBACK_RATIO } from 'lib/route3/constants';
import { useBooleanState } from 'lib/ui/hooks';
import useTippy from 'lib/ui/useTippy';
import { toPercentage } from 'lib/ui/utils';

import RouteImgSrc from '../assets/3route.png';
import { cashbackInfoTippyProps, feeInfoTippyProps } from '../SwapForm.tippy';

import { SwapExchangeRate } from './SwapExchangeRate';
import { SwapMinimumReceived } from './SwapMinimumReceived';

interface ITezosSwapInfoDropdownProps {
  showCashBack: boolean;
  swapRouteSteps: number;
  inputAmount?: BigNumber;
  outputAmount?: BigNumber;
  inputAssetSymbol: string;
  outputAssetSymbol: string;
  outputAssetDecimals: number;
  minimumReceivedAmount?: BigNumber;
}

export const TezosSwapInfoDropdown = ({
  showCashBack,
  swapRouteSteps,
  inputAmount,
  outputAmount,
  inputAssetSymbol,
  outputAssetSymbol,
  outputAssetDecimals,
  minimumReceivedAmount
}: ITezosSwapInfoDropdownProps) => {
  const feeInfoIconRef = useTippy<HTMLSpanElement>(feeInfoTippyProps);
  const cashbackInfoIconRef = useTippy<HTMLSpanElement>(cashbackInfoTippyProps);

  const [dropdownOpened, , , toggleDropdown] = useBooleanState(false);

  return (
    <div className="p-4 bg-white rounded-8 shadow-md">
      <div onClick={toggleDropdown} className="flex justify-between items-center cursor-pointer">
        <div className="flex gap-2 items-center">
          <img src={RouteImgSrc} alt="3Route" className="w-10 h-10 rounded-8" />

          <div className="flex flex-col gap-1">
            <div className="flex gap-1 items-center">
              <span className="font-semibold text-sm">3Route</span>
              {showCashBack && (
                <span
                  className={clsx(
                    'p-1 rounded-[4px] bg-[linear-gradient(136deg,#FF5B00_-2.06%,#F4BE38_103.52%)]',
                    'text-white text-font-small-bold'
                  )}
                >
                  <T id="swapCashback" />
                </span>
              )}
            </div>
            <SwapExchangeRate
              inputAmount={inputAmount}
              outputAmount={outputAmount}
              inputAssetSymbol={inputAssetSymbol}
              outputAssetSymbol={outputAssetSymbol}
            />
          </div>
        </div>
        <IconBase
          Icon={ChevronUpIcon}
          size={12}
          className={clsx(
            'text-grey-1 transform transition-transform duration-200',
            dropdownOpened ? 'rotate-0' : 'rotate-180'
          )}
        />
      </div>

      <div className={clsx('mt-2', dropdownOpened ? 'block' : 'hidden')}>
        <div className={`${showCashBack ? 'block' : 'hidden'}`}>
          <ListBlockItem ref={cashbackInfoIconRef} Icon={GiftIcon} title="swapCashback" divide={false}>
            {toPercentage(SWAP_CASHBACK_RATIO, undefined, Infinity)}
          </ListBlockItem>
        </div>
        <ListBlockItem ref={feeInfoIconRef} Icon={RouteIcon} title="routingFee" divide={showCashBack}>
          {toPercentage(ROUTING_FEE_RATIO, undefined, Infinity)}
        </ListBlockItem>
        <ListBlockItem Icon={StackIcon} title="swapRoute" divide={true}>
          <T id={getPluralKey('steps', swapRouteSteps)} substitutions={swapRouteSteps} />
        </ListBlockItem>
        <ListBlockItem Icon={ArrowDownIcon} title="minReceived" divide={true}>
          <SwapMinimumReceived
            minimumReceivedAmount={minimumReceivedAmount}
            outputAssetSymbol={outputAssetSymbol}
            outputAssetDecimals={outputAssetDecimals}
          />
        </ListBlockItem>
      </div>
    </div>
  );
};

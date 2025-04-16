import React, { forwardRef, ReactNode } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';

import { Divider, IconBase } from 'app/atoms';
import { ReactComponent as ArrowDownIcon } from 'app/icons/base/arrow_down.svg';
import { ReactComponent as ChevronUpIcon } from 'app/icons/base/chevron_up.svg';
import { ReactComponent as GiftIcon } from 'app/icons/base/gift.svg';
import { ReactComponent as RouteIcon } from 'app/icons/base/route.svg';
import { ReactComponent as StackIcon } from 'app/icons/base/stack.svg';
import { T, TID } from 'lib/i18n';
import { AssetMetadataBase } from 'lib/metadata';
import { ROUTING_FEE_RATIO, SWAP_CASHBACK_RATIO } from 'lib/route3/constants';
import { useBooleanState } from 'lib/ui/hooks';
import useTippy from 'lib/ui/useTippy';

import RouteImgSrc from '../assets/3route.png';
import { cashbackInfoTippyProps, feeInfoTippyProps } from '../SwapForm.tippy';

import { SwapExchangeRate } from './SwapExchangeRate';
import { SwapMinimumReceived } from './SwapMinimumReceived';

interface ISwapInfoDropdownProps {
  showCashBack: boolean;
  swapRouteSteps: number;
  inputAmount?: BigNumber;
  outputAmount?: BigNumber;
  inputAssetMetadata: AssetMetadataBase;
  outputAssetMetadata: AssetMetadataBase;
  minimumReceivedAmount?: BigNumber;
}

const LIST_BLOCK_ITEM_DATA_SPAN_CLASSNAME = 'p-1';

export const SwapInfoDropdown = ({
  showCashBack,
  swapRouteSteps,
  inputAmount,
  outputAmount,
  inputAssetMetadata,
  outputAssetMetadata,
  minimumReceivedAmount
}: ISwapInfoDropdownProps) => {
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
                <span className="px-1 py-0.5 rounded-[4px] bg-[linear-gradient(136deg,#FF5B00_-2.06%,#F4BE38_103.52%)] text-white text-font-small-bold">
                  <T id={'swapCashback'} />
                </span>
              )}
            </div>
            <SwapExchangeRate
              inputAmount={inputAmount}
              outputAmount={outputAmount}
              inputAssetMetadata={inputAssetMetadata}
              outputAssetMetadata={outputAssetMetadata}
            />
          </div>
        </div>
        <IconBase
          Icon={ChevronUpIcon}
          className={clsx(
            'text-grey-1 transform transition-transform duration-200',
            dropdownOpened ? 'rotate-0' : 'rotate-180'
          )}
        />
      </div>

      <div className={clsx('mt-2', dropdownOpened ? 'block' : 'hidden')}>
        <div className={`${showCashBack ? 'block' : 'hidden'}`}>
          <ListBlockItem
            ref={cashbackInfoIconRef}
            icon={<IconBase Icon={GiftIcon} className="text-grey-1" />}
            title="swapCashback"
            rightSideJsx={<span className={LIST_BLOCK_ITEM_DATA_SPAN_CLASSNAME}>{SWAP_CASHBACK_RATIO * 100}%</span>}
            divide={false}
          />
        </div>
        <ListBlockItem
          ref={feeInfoIconRef}
          icon={<IconBase Icon={RouteIcon} className="text-grey-1" />}
          title="routingFee"
          rightSideJsx={<span className={LIST_BLOCK_ITEM_DATA_SPAN_CLASSNAME}>{ROUTING_FEE_RATIO * 100}%</span>}
          divide={showCashBack}
        />
        <ListBlockItem
          icon={<IconBase Icon={StackIcon} className="text-grey-1" />}
          title="swapRoute"
          rightSideJsx={
            <span className={LIST_BLOCK_ITEM_DATA_SPAN_CLASSNAME}>
              {swapRouteSteps} {swapRouteSteps === 1 ? 'Step' : 'Steps'}
            </span>
          }
          divide={true}
        />
        <ListBlockItem
          icon={<IconBase Icon={ArrowDownIcon} className="text-grey-1" />}
          title="minimumReceived"
          rightSideJsx={
            <span className={LIST_BLOCK_ITEM_DATA_SPAN_CLASSNAME}>
              <SwapMinimumReceived
                minimumReceivedAmount={minimumReceivedAmount}
                outputAssetMetadata={outputAssetMetadata}
              />
            </span>
          }
          divide={true}
        />
      </div>
    </div>
  );
};

const ListBlockItem = forwardRef<
  HTMLSpanElement,
  {
    title: TID;
    rightSideJsx: ReactNode;
    divide?: boolean;
    icon?: ReactNode;
    tooltipText?: string;
  }
>(({ icon, title, rightSideJsx, divide = true }, ref) => (
  <>
    {divide && <Divider thinest />}
    <div className="flex items-center justify-between min-h-12">
      <span ref={ref} className="flex gap-0.5 items-center cursor-pointer">
        {icon}
        <span className="text-font-description text-grey-1">
          <T id={title} />
        </span>
      </span>
      {rightSideJsx}
    </div>
  </>
));

import React, { forwardRef, ReactNode, useState } from 'react';

import BigNumber from 'bignumber.js';

import { Divider } from 'app/atoms';
import { ReactComponent as ArrowUp } from 'app/icons/arrow-right.svg';
import { ReactComponent as CashbackIcon } from 'app/icons/cashback.svg';
import { ReactComponent as MinReceivedIcon } from 'app/icons/min-received.svg';
import { ReactComponent as RoutingFeeIcon } from 'app/icons/routing-fee.svg';
import { ReactComponent as SwapRouteIcon } from 'app/icons/swap-route.svg';
import { T, TID } from 'lib/i18n';
import { AssetMetadataBase } from 'lib/metadata';
import { ROUTING_FEE_RATIO, SWAP_CASHBACK_RATIO } from 'lib/route3/constants';
import useTippy from 'lib/ui/useTippy';

import RouteImgSrc from '../assets/route.png';
import { cashbackInfoTippyProps, feeInfoTippyProps } from '../SwapForm.tippy';

import { SwapExchangeRate } from './SwapExchangeRate';
import { SwapMinimumReceived } from './SwapMinimumReceived';

interface ISwapInfoDropdownProps {
  showCashBack: boolean;
  swapRouteSteps: number;
  inputAmount: BigNumber | undefined;
  outputAmount: BigNumber | undefined;
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

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-4 bg-white rounded-8 shadow-md">
      <div onClick={() => setIsOpen(!isOpen)} className="flex justify-between items-center cursor-pointer">
        <div className="flex gap-2 items-center">
          <img src={RouteImgSrc} alt="3Route" className="w-10 h-10 rounded-8" />

          <div className="flex flex-col gap-1">
            <div className="flex gap-1 items-center">
              <span className="font-semibold text-sm">3Route</span>
              <span className="px-1 py-0.5 rounded-[4px] bg-[linear-gradient(136deg,#FF5B00_-2.06%,#F4BE38_103.52%)] text-white font-semibold text-[10px]">
                Cashback
              </span>
            </div>
            <SwapExchangeRate
              inputAmount={inputAmount}
              outputAmount={outputAmount}
              inputAssetMetadata={inputAssetMetadata}
              outputAssetMetadata={outputAssetMetadata}
            />
          </div>
        </div>
        <div className="p-1.5">
          <ArrowUp
            className={`transform transition-transform duration-200 ${isOpen ? '-rotate-90' : 'rotate-90'}`}
            width={14}
            height={14}
          />
        </div>
      </div>

      <div className={`mt-2 ${isOpen ? 'block' : 'hidden'}`}>
        <div className={`${showCashBack ? 'block' : 'hidden'}`}>
          <ListBlockItem
            ref={cashbackInfoIconRef}
            icon={<CashbackIcon />}
            title="swapCashback"
            rightSideJsx={<span className={LIST_BLOCK_ITEM_DATA_SPAN_CLASSNAME}>{SWAP_CASHBACK_RATIO * 100}%</span>}
            divide={false}
          />
        </div>
        <ListBlockItem
          ref={feeInfoIconRef}
          icon={<RoutingFeeIcon />}
          title="routingFee"
          rightSideJsx={<span className={LIST_BLOCK_ITEM_DATA_SPAN_CLASSNAME}>{ROUTING_FEE_RATIO * 100}%</span>}
          divide={showCashBack}
        />
        <ListBlockItem
          icon={<SwapRouteIcon />}
          title="swapRoute"
          rightSideJsx={
            <span className={LIST_BLOCK_ITEM_DATA_SPAN_CLASSNAME}>
              {swapRouteSteps} {swapRouteSteps === 1 ? 'Step' : 'Steps'}
            </span>
          }
          divide={true}
        />
        <ListBlockItem
          icon={<MinReceivedIcon />}
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
>(({ icon, title, rightSideJsx, divide = true }, ref) => {
  return (
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
  );
});

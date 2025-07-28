import React, { useMemo } from 'react';

import BigNumber from 'bignumber.js';
import clsx from 'clsx';

import { IconBase } from 'app/atoms';
import Money from 'app/atoms/Money';
import { ReactComponent as ArrowDownIcon } from 'app/icons/base/arrow_down.svg';
import { ReactComponent as BridgeIcon } from 'app/icons/base/bridge.svg';
import { ReactComponent as ChevronUpIcon } from 'app/icons/base/chevron_up.svg';
import { ReactComponent as ClockIcon } from 'app/icons/base/clock.svg';
import { ReactComponent as DollarIcon } from 'app/icons/base/dollar.svg';
import { ReactComponent as FeeIcon } from 'app/icons/base/fee.svg';
import { ReactComponent as PriceImpactIcon } from 'app/icons/base/price-impact.svg';
import { ReactComponent as RouteIcon } from 'app/icons/base/route.svg';
import { BridgeDetails } from 'app/pages/Swap/form/interfaces';
import { ListBlockItem } from 'app/pages/Swap/form/SwapInfoDropdown/ListBlockItem';
import { getPluralKey, T } from 'lib/i18n';
import { ROUTING_FEE_RATIO } from 'lib/route3/constants';
import { useBooleanState } from 'lib/ui/hooks';
import useTippy from 'lib/ui/useTippy';
import { toPercentage } from 'lib/ui/utils';

import LiFiImgSrc from '../assets/lifi.png';
import { evmFeeInfoTippyProps, protocolFeeInfoTippyProps } from '../SwapForm.tippy';

import { SwapExchangeRate } from './SwapExchangeRate';
import { SwapMinimumReceived } from './SwapMinimumReceived';

interface IEvmSwapInfoDropdownProps {
  swapRouteSteps: number;
  inputAmount?: BigNumber;
  outputAmount?: BigNumber;
  inputAssetSymbol: string;
  outputAssetSymbol: string;
  outputAssetDecimals: number;
  minimumReceivedAmount?: BigNumber;
  bridgeDetails?: BridgeDetails;
}

export const EvmSwapInfoDropdown = ({
  swapRouteSteps,
  inputAmount,
  outputAmount,
  inputAssetSymbol,
  outputAssetSymbol,
  outputAssetDecimals,
  minimumReceivedAmount,
  bridgeDetails
}: IEvmSwapInfoDropdownProps) => {
  const feeInfoIconRef = useTippy<HTMLSpanElement>(evmFeeInfoTippyProps);
  const protocolFeeInfoIconRef = useTippy<HTMLSpanElement>(protocolFeeInfoTippyProps);

  const [dropdownOpened, , , toggleDropdown] = useBooleanState(false);

  const positivePriceImpact = useMemo(
    () => bridgeDetails?.priceImpact && bridgeDetails?.priceImpact < 0,
    [bridgeDetails?.priceImpact]
  );

  return (
    <div className="p-4 bg-white rounded-8 shadow-md">
      <div onClick={toggleDropdown} className="flex justify-between items-center cursor-pointer">
        <div className="flex gap-2 items-center">
          <img src={LiFiImgSrc} alt="lifi" className="w-10 h-10 rounded-8" />

          <div className="flex flex-col gap-1">
            <div className="flex gap-1 items-center">
              <span className="font-semibold text-sm">Li.Fi</span>
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
        {bridgeDetails?.tool && (
          <ListBlockItem Icon={BridgeIcon} title="bridge" divide={false}>
            <div className="flex gap-1 align-center items-center">
              {bridgeDetails.tool?.name}{' '}
              <img src={bridgeDetails?.tool?.logoURI} className="w-6 h-6" alt="bridge logo" />
            </div>
          </ListBlockItem>
        )}
        {bridgeDetails?.protocolFee && (
          <ListBlockItem ref={protocolFeeInfoIconRef} Icon={DollarIcon} title="protocolFee">
            <Money smallFractionFont={false} fiat={false}>
              {bridgeDetails.protocolFee}
            </Money>{' '}
            {bridgeDetails.gasTokenSymbol}
          </ListBlockItem>
        )}
        <ListBlockItem Icon={RouteIcon} title="route" divide={!!bridgeDetails}>
          <T id={getPluralKey('steps', swapRouteSteps)} substitutions={swapRouteSteps} />
        </ListBlockItem>
        {bridgeDetails?.executionTime && (
          <ListBlockItem Icon={ClockIcon} title="estimatedTime">
            ≈ {bridgeDetails?.executionTime}
          </ListBlockItem>
        )}
        {bridgeDetails?.priceImpact && (
          <ListBlockItem Icon={PriceImpactIcon} title="priceImpact">
            <span className={positivePriceImpact ? 'text-success' : 'text-error'}>
              {positivePriceImpact ? '+' : '-'}
              {toPercentage(bridgeDetails.priceImpact?.toFixed(4), undefined, Infinity)}
            </span>
          </ListBlockItem>
        )}
        <ListBlockItem ref={feeInfoIconRef} Icon={FeeIcon} title="routingFee">
          {toPercentage(ROUTING_FEE_RATIO, undefined, Infinity)}
        </ListBlockItem>
        <ListBlockItem Icon={ArrowDownIcon} title="minReceived">
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

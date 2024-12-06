import React, { FC, useMemo } from 'react';

import classNames from 'clsx';

import { ReactComponent as Separator } from 'app/icons/separator.svg';
import { TezosAssetImageStacked } from 'app/templates/AssetImage';
import { SIRS_TOKEN_METADATA } from 'lib/assets/known-tokens';
import useTippy from 'lib/ui/useTippy';

import { SwapRouteAmounts } from './SwapRouteItem/swap-route-amounts';

interface Props {
  isLbOutput: boolean;
  amount: string | undefined;
  totalChains: number;
}

export const LbPoolPart: FC<Props> = ({ amount, isLbOutput, totalChains }) => {
  const dexInfoDivRef = useTippy<HTMLDivElement>({
    trigger: 'mouseenter',
    hideOnClick: false,
    content: '3Route SIRS',
    animation: 'shift-away-subtle'
  });

  const advancedLbPoolItemStyles = useMemo(
    () => ({ height: 36 * totalChains + 8 * (totalChains - 1) - 6 }),
    [totalChains]
  );

  return (
    <div
      className={classNames('flex flex-row justify-between items-center relative', isLbOutput && 'flex-row-reverse')}
    >
      <SwapRouteAmounts
        amount={amount ?? '0'}
        baseAmount={amount}
        className={isLbOutput ? 'text-right' : 'text-left'}
      />

      <div
        className={classNames(
          'flex flex-1 flex-row relative justify-around items-center overflow-hidden',
          isLbOutput ? 'pr-2' : 'pl-2'
        )}
      >
        <div className="absolute flex-1 w-full h-full flex items-center justify-center">
          <Separator style={{ minWidth: 264 }} />
        </div>

        <div
          className="flex items-center p-1 border border-gray-400 rounded-lg bg-white z-1"
          style={advancedLbPoolItemStyles}
        >
          <div ref={dexInfoDivRef}>
            <TezosAssetImageStacked metadata={SIRS_TOKEN_METADATA} className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};

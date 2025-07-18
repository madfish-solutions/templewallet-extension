import React, { memo, ReactNode } from 'react';

import clsx from 'clsx';

import { Button } from 'app/atoms';
import Money from 'app/atoms/Money';
import { SwapFieldName } from 'app/pages/Swap/form/interfaces';
import { T } from 'lib/i18n';
import useTippy from 'lib/ui/useTippy';

interface SwapInputHeaderProps {
  label: ReactNode;
  inputName: SwapFieldName;
  isBalanceError: boolean;
  assetDecimals: number;
  handleSetMaxAmount: EmptyFn;
  assetBalanceStr?: string;
}

const SwapInputHeader = memo<SwapInputHeaderProps>(
  ({ label, inputName, isBalanceError, assetDecimals, handleSetMaxAmount, assetBalanceStr }) => {
    const fullBalanceStrRef = useTippy<HTMLButtonElement>({
      trigger: 'mouseenter',
      hideOnClick: false,
      content: assetBalanceStr,
      animation: 'shift-away-subtle'
    });

    return (
      <div className="w-full flex items-center justify-between my-1">
        <span className="text-font-description-bold">{label}</span>
        {assetBalanceStr && (
          <span className="text-xs text-grey-1 flex items-center">
            <span className="mr-1">
              <T id="balance" />:
            </span>
            {inputName === 'input' ? (
              <Button
                ref={assetDecimals > 6 ? fullBalanceStrRef : null}
                onClick={handleSetMaxAmount}
                className={clsx('text-xs text-font-num', isBalanceError ? 'text-error underline' : 'text-secondary')}
              >
                <Money tooltip={false} smallFractionFont={false} fiat={false}>
                  {assetBalanceStr}
                </Money>
              </Button>
            ) : (
              <span className="text-xs text-grey-1 text-font-num">
                <Money smallFractionFont={false} fiat={false}>
                  {assetBalanceStr}
                </Money>
              </span>
            )}
          </span>
        )}
      </div>
    );
  }
);

export default SwapInputHeader;

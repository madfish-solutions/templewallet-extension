import React, { FC } from 'react';

import classNames from 'clsx';

import Popper from 'lib/ui/Popper';
import { sameWidthModifiers } from 'lib/ui/same-width-modifiers';
import { isTruthy } from 'lib/utils';

import { PaymentProviderInputHeader } from './PaymentProviderInputHeader';
import { PaymentProvidersMenu } from './PaymentProvidersMenu';
import { PaymentProviderInputProps } from './types';

export const PaymentProviderInput: FC<PaymentProviderInputProps> = ({
  className,
  error,
  value,
  options,
  isLoading,
  onChange,
  headerTestID,
  testID
}) => (
  <div className={classNames('w-full', className)}>
    <Popper
      placement="bottom"
      strategy="fixed"
      modifiers={sameWidthModifiers}
      fallbackPlacementsEnabled={false}
      popup={({ opened, setOpened }) => (
        <PaymentProvidersMenu
          value={value}
          options={options}
          isLoading={isLoading}
          opened={opened}
          testID={testID}
          setOpened={setOpened}
          onChange={onChange}
        />
      )}
    >
      {({ ref, opened, toggleOpened, setOpened }) => (
        <PaymentProviderInputHeader
          ref={ref as unknown as React.RefObject<HTMLDivElement>}
          value={value}
          opened={opened}
          setOpened={setOpened}
          toggleOpened={toggleOpened}
          testID={headerTestID}
        />
      )}
    </Popper>
    {isTruthy(error) && <span className="mt-1 text-xs text-red-700 leading-relaxed">{error}</span>}
  </div>
);

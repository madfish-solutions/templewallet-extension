import React, { forwardRef, InputHTMLAttributes, useMemo } from 'react';

import clsx from 'clsx';

import { ReactComponent as CheckmarkEmptyIcon } from 'app/icons/monochrome/checkmark-empty.svg';
import { ReactComponent as CheckmarkFilledIcon } from 'app/icons/monochrome/checkmark-fill.svg';
import { TestIDProps, setTestID } from 'lib/analytics';

import { useCheckboxHooks } from './Checkbox';
import { IconBase } from './IconBase';

export interface CheckboxV2Props
  extends TestIDProps,
    Pick<
      InputHTMLAttributes<HTMLInputElement>,
      'name' | 'checked' | 'className' | 'onFocus' | 'onBlur' | 'onClick' | 'disabled'
    > {
  errored?: boolean;
  onChange?: (checked: boolean, event: React.ChangeEvent<HTMLInputElement>) => void;
}

interface Props extends CheckboxV2Props {
  overrideClassNames?: string;
}

export const CheckboxV2 = forwardRef<HTMLInputElement, Props>((props, ref) => {
  const { overrideClassNames, errored = false, className, testID, disabled, ...rest } = props;

  const { localChecked, localFocused, handleChange, handleFocus, handleBlur } = useCheckboxHooks(props);

  const containerClassName = useMemo(
    () =>
      clsx(
        'flex justify-center items-center flex-shrink-0 transition ease-in-out duration-200 disable-outline-for-click',
        localFocused && 'shadow-outline'
      ),
    [localFocused]
  );

  return (
    <div className={containerClassName} {...setTestID(testID)}>
      <input
        {...rest}
        disabled={disabled}
        ref={ref}
        type="checkbox"
        className={clsx('sr-only', className)}
        checked={localChecked}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />

      <IconBase size={16} Icon={localChecked ? CheckmarkFilledIcon : CheckmarkEmptyIcon} className="text-primary" />
    </div>
  );
});

import React, { forwardRef, memo, useMemo } from 'react';

import clsx from 'clsx';
import { isEqual } from 'lodash';

import { ReactComponent as FilterOffIcon } from 'app/icons/base/filteroff.svg';
import { ReactComponent as FilterOnIcon } from 'app/icons/base/filteron.svg';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { AssetsFilterOptionsInitialState } from 'app/store/assets-filter-options/state';
import { ACTIVE_STYLED_BUTTON_COLORS_CLASSNAME } from 'lib/ui/use-styled-button-or-link-props';

import { Button } from './Button';
import { IconBase } from './IconBase';

interface FilterButtonProps {
  active: boolean;
  disabled?: boolean;
  onClick?: EmptyFn;
}

export const FilterButton = memo(
  forwardRef<HTMLButtonElement, FilterButtonProps>(({ active, disabled, onClick }, ref) => {
    const options = useAssetsFilterOptionsSelector();

    const isNonDefaultOption = useMemo(() => !isEqual(options, AssetsFilterOptionsInitialState), [options]);

    const colorClassName = useMemo(() => {
      if (active) return clsx(ACTIVE_STYLED_BUTTON_COLORS_CLASSNAME, 'shadow-none');

      return 'bg-white text-primary shadow-bottom hover:bg-grey-4 hover:shadow-none hover:text-primary-hover';
    }, [active]);

    return (
      <Button ref={ref} onClickCapture={onClick} className={clsx('p-1 rounded-md', colorClassName)} disabled={disabled}>
        <IconBase
          size={16}
          Icon={!active && isNonDefaultOption ? FilterOnIcon : FilterOffIcon}
          className={clsx(!active && 'text-primary')}
        />
      </Button>
    );
  })
);

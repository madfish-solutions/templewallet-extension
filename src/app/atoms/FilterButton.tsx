import React, { memo, useMemo } from 'react';

import clsx from 'clsx';
import { isEqual } from 'lodash';

import { ReactComponent as FilterOffIcon } from 'app/icons/base/filteroff.svg';
import { ReactComponent as FilterOnIcon } from 'app/icons/base/filteron.svg';
import { useTokensFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { DefaultTokensFilterOptions } from 'app/store/assets-filter-options/state';

import { Button } from './Button';
import { IconBase } from './IconBase';
import { ACTIVE_STYLED_BUTTON_COLORS_CLASSNAME } from './StyledButton';

interface FilterButtonProps {
  active: boolean;
  disabled?: boolean;
  onClick?: EmptyFn;
}

export const FilterButton = memo<FilterButtonProps>(({ active, disabled, onClick }) => {
  const options = useTokensFilterOptionsSelector();

  const isNonDefaultOption = useMemo(() => !isEqual(options, DefaultTokensFilterOptions), [options]);

  const colorClassName = useMemo(() => {
    if (active) return clsx(ACTIVE_STYLED_BUTTON_COLORS_CLASSNAME, 'shadow-none');

    return 'bg-white text-primary shadow-bottom hover:bg-grey-4 hover:shadow-none hover:text-primary-hover';
  }, [active]);

  return (
    <Button className={clsx('p-1 rounded-md', colorClassName)} disabled={disabled} onClick={onClick}>
      <IconBase
        size={16}
        Icon={!active && isNonDefaultOption ? FilterOnIcon : FilterOffIcon}
        className={clsx(!active && 'text-primary')}
      />
    </Button>
  );
});

import React from 'react';

import classNames from 'clsx';

import Popper from 'lib/ui/Popper';
import { sameWidthModifiers } from 'lib/ui/same-width-modifiers';

import { CurrenciesMenu } from './CurrenciesMenu';
import { TopUpInputHeader } from './TopUpInputHeader';
import { TopUpInputPropsGeneric, CurrencyBase, TopUpInputPropsBase } from './types';
import { useFilteredCurrencies } from './utils';

export type { CurrencyToken } from './types';

export const TopUpInput = <C extends CurrencyBase>(_props: TopUpInputPropsGeneric<C>) => {
  const {
    currency,
    currenciesList,
    isFiat,
    isCurrenciesLoading,
    fitIcons,
    className,
    testID,
    onCurrencySelect,
    emptyListPlaceholder,
    ...restProps
  } = _props as unknown as TopUpInputPropsBase;
  const fitIconsValue = typeof fitIcons === 'function' ? fitIcons(currency) : fitIcons;

  const { filteredCurrencies, searchValue, setSearchValue } = useFilteredCurrencies(currenciesList);

  return (
    <div className={classNames('w-full', className)}>
      <Popper
        placement="bottom"
        strategy="fixed"
        modifiers={sameWidthModifiers}
        fallbackPlacementsEnabled={false}
        popup={({ opened, setOpened }) => (
          <CurrenciesMenu
            isFiat={isFiat}
            value={currency}
            options={filteredCurrencies}
            isLoading={isCurrenciesLoading}
            opened={opened}
            fitIcons={fitIcons}
            emptyListPlaceholder={emptyListPlaceholder}
            testID={testID}
            setOpened={setOpened}
            onChange={onCurrencySelect}
          />
        )}
      >
        {({ ref, opened, toggleOpened, setOpened }) => (
          <TopUpInputHeader
            ref={ref as unknown as React.RefObject<HTMLDivElement>}
            currency={currency}
            currenciesList={currenciesList}
            isFiat={isFiat}
            opened={opened}
            fitIcons={fitIconsValue}
            setOpened={setOpened}
            toggleOpened={toggleOpened}
            searchString={searchValue}
            onSearchChange={e => setSearchValue(e.target.value)}
            {...restProps}
          />
        )}
      </Popper>
    </div>
  );
};

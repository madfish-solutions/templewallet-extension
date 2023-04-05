import React from 'react';

import { Modifier } from '@popperjs/core';
import classNames from 'clsx';

import Popper from 'lib/ui/Popper';

import { CurrenciesMenu } from './CurrenciesMenu';
import { TopUpInputHeader } from './TopUpInputHeader';
import { TopUpInputPropsGeneric, CurrencyBase, TopUpInputPropsBase } from './types';
import { useFilteredCurrencies } from './utils';

export type { CurrencyToken } from './types';

export const TopUpInput = <C extends CurrencyBase>(_props: TopUpInputPropsGeneric<C>) => {
  const { currency, currenciesList, isCurrenciesLoading, fitIcons, className, testID, onCurrencySelect, ...restProps } =
    _props as unknown as TopUpInputPropsBase;

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
            value={currency}
            options={filteredCurrencies}
            isLoading={isCurrenciesLoading}
            opened={opened}
            fitIcons={fitIcons}
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
            opened={opened}
            fitIcons={fitIcons}
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

const sameWidthModifiers: Modifier<string, any>[] = [
  {
    name: 'sameWidth',
    enabled: true,
    phase: 'beforeWrite',
    requires: ['computeStyles'],
    fn: ({ state }) => {
      state.styles.popper.width = `${state.rects.reference.width}px`;
    },
    effect: ({ state }) => {
      state.elements.popper.style.width = `${(state.elements.reference as any).offsetWidth}px`;
      return () => {};
    }
  }
];

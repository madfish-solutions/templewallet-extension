import React, { FC } from 'react';

import { Modifier } from '@popperjs/core';
import classNames from 'clsx';

import Popper from 'lib/ui/Popper';

import { useFilteredCurrencies } from '../../hooks/useFilteredCurrencies.hook';
import { CurrenciesMenu } from './CurrenciesMenu/CurrenciesMenu';
import { TopUpInputProps } from './TopUpInput.props';
import { TopUpInputHeader } from './TopUpInputHeader/TopUpInputHeader';

const sameWidthModifiers: Array<Modifier<string, any>> = [
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

export const TopUpInput: FC<TopUpInputProps> = ({
  currencyName,
  currenciesList,
  setCurrencyName = () => {},
  className,
  isCurrenciesLoading,
  ...rest
}) => {
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
            value={currencyName}
            options={filteredCurrencies}
            isLoading={isCurrenciesLoading}
            opened={opened}
            setOpened={setOpened}
            onChange={currencyName => setCurrencyName(currencyName)}
          />
        )}
      >
        {({ ref, opened, toggleOpened, setOpened }) => (
          <TopUpInputHeader
            ref={ref as unknown as React.RefObject<HTMLDivElement>}
            currencyName={currencyName}
            currenciesList={currenciesList}
            isCurrenciesLoading={isCurrenciesLoading}
            setCurrencyName={setCurrencyName}
            className={className}
            opened={opened}
            setOpened={setOpened}
            toggleOpened={toggleOpened}
            searchString={searchValue}
            onSearchChange={e => setSearchValue(e.target.value)}
            {...rest}
          />
        )}
      </Popper>
    </div>
  );
};

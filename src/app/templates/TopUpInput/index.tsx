import React, { FC } from 'react';

import classNames from 'clsx';
import { isEqual } from 'lodash';

import AssetField from 'app/atoms/AssetField';
import { getBigErrorText, getSmallErrorText } from 'app/pages/Buy/utils/errorText.utils';
import { getAssetSymbolToDisplay } from 'lib/buy-with-credit-card/get-asset-symbol-to-display';
import { T, toLocalFormat } from 'lib/i18n';

import { DropdownSelect } from '../DropdownSelect/DropdownSelect';
import { InputContainer } from '../InputContainer/InputContainer';

import { CurrencyOption } from './CurrencyOption';
import { StaticCurrencyImage } from './StaticCurrencyImage';
import { TopUpInputPropsGeneric, CurrencyBase, TopUpInputPropsBase } from './types';
import { getProperNetworkFullName, useFilteredCurrencies } from './utils';

export type { CurrencyToken } from './types';

const TWO_TOKENS_LENGTH = 2;

const renderOptionContent = (currency: CurrencyBase, isSelected: boolean) => (
  <CurrencyOption currency={currency} isSelected={isSelected} />
);

export const TopUpInput = <C extends CurrencyBase>(_props: TopUpInputPropsGeneric<C>) => {
  const {
    currency,
    currenciesList,
    isFiat,
    isCurrenciesLoading,
    fitIcons,
    className,
    testID,
    amountInputDisabled,
    emptyListPlaceholder,
    amount,
    decimals,
    readOnly,
    label,
    maxAmount,
    minAmount,
    isMaxAmountError,
    isMinAmountError,
    isInsufficientTezBalanceError,
    onCurrencySelect,
    onAmountChange
  } = _props as unknown as TopUpInputPropsBase;
  const fitIconsValue = typeof fitIcons === 'function' ? fitIcons(currency) : Boolean(fitIcons);

  const { filteredCurrencies, searchValue, setSearchValue } = useFilteredCurrencies(currenciesList);
  const singleToken = currenciesList.length < TWO_TOKENS_LENGTH;
  const minAmountErrorClassName = getBigErrorText(isMinAmountError);

  const handleAmountChange = (newInputValue?: string) => {
    const newValue = newInputValue ? Number(newInputValue) : undefined;
    onAmountChange?.(newValue);
  };

  return (
    <div className={classNames('w-full', className)}>
      <InputContainer
        header={
          <div className="w-full flex items-center justify-between">
            <span className="text-xl text-gray-900 leading-tight">{label}</span>
            {minAmount && (
              <p className={getSmallErrorText(isMinAmountError)}>
                <T id="min" /> <span className={classNames(minAmountErrorClassName, 'text-sm')}>{' ' + minAmount}</span>{' '}
                <span className={minAmountErrorClassName}>{currency.code}</span>
              </p>
            )}
          </div>
        }
        footer={
          <ErrorsComponent
            coin={currency.code}
            isInsufficientTezBalanceError={isInsufficientTezBalanceError}
            isMaxAmountError={isMaxAmountError}
            maxAmount={maxAmount}
          />
        }
      >
        <DropdownSelect<CurrencyBase>
          testID={testID}
          dropdownButtonClassName="pl-4 pr-3 py-5"
          DropdownFaceContent={
            <TopUpMainContent
              isFiat={isFiat}
              singleToken={singleToken}
              fitIconsValue={fitIconsValue}
              currency={currency}
            />
          }
          Input={
            <div
              className={classNames(
                'flex-1 flex items-center justify-between px-2 h-18',
                amountInputDisabled && 'bg-gray-100'
              )}
            >
              <div className="h-full flex-1 flex items-end justify-center flex-col">
                <AssetField
                  value={amount?.toString()}
                  assetDecimals={decimals}
                  readOnly={readOnly}
                  className={classNames(
                    'appearance-none w-full pl-0 border-2 border-gray-300 bg-gray-100 rounded-md leading-tight',
                    'focus:bg-transparent focus:border-primary-orange focus:outline-none focus:shadow-outline, focus:shadow-none',
                    'text-gray-700 text-2xl text-right placeholder-alphagray border-none bg-opacity-0',
                    'transition ease-in-out duration-200'
                  )}
                  style={{ padding: 0, borderRadius: 0 }}
                  placeholder={toLocalFormat(0, { decimalPlaces: 2 })}
                  type="text"
                  min={0}
                  maxLength={15}
                  disabled={amountInputDisabled}
                  fieldWrapperBottomMargin={false}
                  onChange={handleAmountChange}
                />
              </div>
            </div>
          }
          optionsProps={{
            isLoading: isCurrenciesLoading,
            options: filteredCurrencies,
            noItemsText: emptyListPlaceholder,
            getKey: option => option.code,
            renderOptionContent: currCurrency => renderOptionContent(currCurrency, isEqual(currCurrency, currency)),
            onOptionChange: newValue => onCurrencySelect?.(newValue)
          }}
          searchProps={{
            searchValue,
            onSearchChange: event => setSearchValue(event.target.value)
          }}
        />
      </InputContainer>
    </div>
  );
};

interface TopUpMainContentProps {
  singleToken: boolean;
  fitIconsValue: boolean;
  isFiat?: boolean;
  currency: CurrencyBase;
}

const TopUpMainContent: FC<TopUpMainContentProps> = ({ singleToken, currency, fitIconsValue, isFiat }) => {
  return (
    <div className="w-full flex items-stretch">
      <div className={classNames('flex items-center gap-2', !singleToken && 'cursor-pointer')}>
        <StaticCurrencyImage
          currencyCode={currency.code}
          isFiat={isFiat}
          imageSrc={currency.icon}
          fitImg={fitIconsValue}
        />
        <div className="flex flex-col text-left whitespace-nowrap">
          <span className="text-gray-700 font-normal text-lg overflow-ellipsis overflow-hidden w-16">
            {getAssetSymbolToDisplay(currency)}
          </span>
          <span className="text-indigo-500 font-medium overflow-ellipsis overflow-hidden w-12 text-xxs">
            {currency.network?.shortName ?? getProperNetworkFullName(currency)}
          </span>
        </div>
      </div>
    </div>
  );
};

interface ErrorsComponentProps {
  isInsufficientTezBalanceError?: boolean;
  isMaxAmountError?: boolean;
  maxAmount?: string;
  coin: string;
}

const ErrorsComponent: React.FC<ErrorsComponentProps> = ({
  isInsufficientTezBalanceError,
  isMaxAmountError,
  maxAmount,
  coin
}) => (
  <div className="flex justify-between items-baseline">
    <p className={isInsufficientTezBalanceError ? 'text-red-700' : 'text-transparent'}>
      <T id="insufficientTezBalance" />
    </p>
    {maxAmount && (
      <p className={getSmallErrorText(isMaxAmountError)}>
        <CurrencyText className={getBigErrorText(isMaxAmountError)} coin={coin} maxAmount={maxAmount} />
      </p>
    )}
  </div>
);

const CurrencyText: React.FC<ErrorsComponentProps & { className: string }> = ({ className, coin, maxAmount }) => (
  <>
    <T id="max" />
    {':'}
    <span className={classNames(className, 'text-sm')}> {maxAmount !== 'Infinity' ? maxAmount : '0'}</span>{' '}
    <span className={classNames(className, 'text-xs')}>{coin}</span>
  </>
);

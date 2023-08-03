import React, { ChangeEvent, forwardRef, FocusEvent, useEffect, useRef, useState } from 'react';

import { emptyFn } from '@rnw-community/shared';
import classNames from 'clsx';

import AssetField from 'app/atoms/AssetField';
import { ReactComponent as ChevronDownIcon } from 'app/icons/chevron-down.svg';
import { ReactComponent as SearchIcon } from 'app/icons/search.svg';
import { getBigErrorText, getSmallErrorText } from 'app/pages/Buy/utils/errorText.utils';
import { getAssetSymbolToDisplay } from 'lib/buy-with-credit-card/get-asset-symbol-to-display';
import { toLocalFormat, T, t } from 'lib/i18n';
import { PopperRenderProps } from 'lib/ui/Popper';

import { StaticCurrencyImage } from './StaticCurrencyImage';
import { TopUpInputPropsBase } from './types';
import { getProperNetworkFullName } from './utils';

interface Props extends PopperRenderProps, Omit<TopUpInputPropsBase, 'fitIcons'> {
  fitIcons?: boolean;
  searchString: string;
  onSearchChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const TopUpInputHeader = forwardRef<HTMLDivElement, Props>(
  (
    {
      isFiat,
      currenciesList,
      currency,
      amount,
      decimals = 2,
      label,
      readOnly,
      opened,
      searchString,
      toggleOpened,
      amountInputDisabled,
      minAmount,
      maxAmount,
      isMinAmountError,
      isMaxAmountError,
      isInsufficientTezBalanceError,
      isSearchable = false,
      fitIcons,
      onAmountChange = emptyFn,
      onSearchChange
    },
    ref
  ) => {
    const amountFieldRef = useRef<HTMLInputElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const prevOpenedRef = useRef(opened);

    const [isActive, setIsActive] = useState(false);

    const minAmountErrorClassName = getBigErrorText(isMinAmountError);

    useEffect(() => {
      if (!prevOpenedRef.current && opened) {
        searchInputRef.current?.focus();
      }
      prevOpenedRef.current = opened;
    }, [opened]);

    const handleFocus = () => setIsActive(true);
    const handleBlur = () => setIsActive(false);

    const handleAmountFieldFocus = (event: FocusEvent<HTMLInputElement> | FocusEvent<HTMLTextAreaElement>) => {
      event.preventDefault();
      setIsActive(true);
      amountFieldRef.current?.focus({ preventScroll: true });
    };

    const handleAmountChange = (newInputValue?: string) => {
      const newValue = newInputValue ? Number(newInputValue) : undefined;
      onAmountChange(newValue);
    };

    const singleToken = currenciesList.length < 2;

    return (
      <div className="w-full text-gray-700">
        <div className="w-full flex mb-1 items-center justify-between">
          <span className="text-xl text-gray-900 leading-tight">{label}</span>
          {minAmount && !opened && (
            <p className={getSmallErrorText(isMinAmountError)}>
              <T id="min" /> <span className={classNames(minAmountErrorClassName, 'text-sm')}>{' ' + minAmount}</span>{' '}
              <span className={minAmountErrorClassName}>{currency.code}</span>
            </p>
          )}
        </div>
        <div
          className={classNames(
            isActive && 'border-orange-500 bg-gray-100',
            'transition ease-in-out duration-200',
            'w-full border rounded-md border-gray-300'
          )}
          ref={ref}
        >
          {isSearchable && (
            <div className={classNames('w-full flex items-stretch', !opened && 'hidden')} style={{ height: '4.5rem' }}>
              <div className="items-center ml-5 mr-3 my-6">
                <SearchIcon className="w-6 h-auto text-gray-500 stroke-current stroke-2" />
              </div>
              <div className="text-lg flex flex-1 items-stretch">
                <div className="flex-1 flex items-stretch mr-2">
                  <input
                    ref={searchInputRef}
                    value={searchString}
                    className="w-full px-2 bg-transparent"
                    placeholder={t('swapTokenSearchInputPlaceholder')}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    onChange={onSearchChange}
                  />
                </div>
              </div>
            </div>
          )}
          <div
            className={classNames('w-full flex items-stretch', opened && isSearchable && 'hidden')}
            style={{ height: '4.5rem' }}
          >
            <div
              className={classNames(
                'border-r border-gray-300 pl-4 pr-3 flex py-5 items-center',
                !singleToken && 'cursor-pointer'
              )}
              onClick={singleToken ? undefined : toggleOpened}
            >
              <StaticCurrencyImage
                currencyCode={currency.code}
                isFiat={isFiat}
                imageSrc={currency.icon}
                fitImg={fitIcons}
              />
              <div className="flex flex-col ml-2 text-left whitespace-nowrap">
                <span className="text-gray-700 font-normal text-lg overflow-ellipsis overflow-hidden w-16">
                  {getAssetSymbolToDisplay(currency)}
                </span>
                <span
                  className="text-indigo-500 font-medium overflow-ellipsis overflow-hidden w-12"
                  style={{ fontSize: 11 }}
                >
                  {currency.network?.shortName ?? getProperNetworkFullName(currency)}
                </span>
              </div>

              {singleToken ? (
                <span className="w-4 ml-2"></span>
              ) : (
                <ChevronDownIcon className="w-4 ml-2 h-auto text-gray-700 stroke-current stroke-2" />
              )}
            </div>
            <div
              className={classNames(
                'flex-1 px-2 flex items-center justify-between',
                amountInputDisabled && 'bg-gray-100'
              )}
            >
              <div className="h-full flex-1 flex items-end justify-center flex-col">
                <AssetField
                  ref={amountFieldRef}
                  value={amount?.toString()}
                  assetDecimals={decimals}
                  readOnly={readOnly}
                  className={classNames(
                    'appearance-none w-full py-3 pl-0 border-2 border-gray-300 bg-gray-100 rounded-md leading-tight',
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
                  onBlur={handleBlur}
                  onFocus={handleAmountFieldFocus}
                  onChange={handleAmountChange}
                />
              </div>
            </div>
          </div>
        </div>
        {maxAmount && !opened && (
          <ErrorsComponent
            isInsufficientTezBalanceError={isInsufficientTezBalanceError}
            isMaxAmountError={isMaxAmountError}
            maxAmount={maxAmount}
            coin={currency.code}
          />
        )}
      </div>
    );
  }
);

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
  <div className="flex justify-between items-baseline mt-1">
    <p className={classNames(isInsufficientTezBalanceError ? 'text-red-700' : 'text-transparent')}>
      <T id="insufficientTezBalance" />
    </p>
    <p className={getSmallErrorText(isMaxAmountError)}>
      <CurrencyText className={getBigErrorText(isMaxAmountError)} coin={coin} maxAmount={maxAmount} />
    </p>
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

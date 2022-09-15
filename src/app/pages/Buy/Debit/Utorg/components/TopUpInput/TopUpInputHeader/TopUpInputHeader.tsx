import React, { ChangeEvent, forwardRef, FocusEvent, useEffect, useRef, useState } from 'react';

import classNames from 'clsx';

import { ReactComponent as ChevronDownIcon } from 'app/icons/chevron-down.svg';
import { ReactComponent as SearchIcon } from 'app/icons/search.svg';
import { getBigErrorText, getSmallErrorText } from 'app/pages/Buy/utils/errorText.utils';
import { T, t } from 'lib/i18n/react';
import { PopperRenderProps } from 'lib/ui/Popper';

import { toLocalFormat } from '../../../../../../../../lib/i18n/numbers';
import { handleNumberInput } from '../../../../../utils/handleNumberInput.util';
import { StaticCurrencyImage } from '../StaticCurrencyImage/StaticCurrencyImage';
import { TopUpInputProps } from '../TopUpInput.props';

interface Props extends PopperRenderProps, TopUpInputProps {
  searchString: string;
  onSearchChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const TopUpInputHeader = forwardRef<HTMLDivElement, Props>(
  (
    {
      currencyName,
      amount,
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
      isSearchable = false,
      singleToken = false,
      onAmountChange,
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

    return (
      <div className="w-full text-gray-700">
        <div className="w-full flex mb-1 items-center justify-between">
          <span className="text-xl text-gray-900">{label}</span>
          {minAmount && !opened && (
            <p className={getSmallErrorText(isMinAmountError)} style={{ marginBottom: -10 }}>
              <T id="min" /> <span className={classNames(minAmountErrorClassName, 'text-sm')}>{' ' + minAmount}</span>{' '}
              <span className={classNames(minAmountErrorClassName, 'text-xs')}>{currencyName}</span>
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
                currencyName={currencyName}
                style={{
                  borderRadius: '50%',
                  width: 32,
                  height: 32
                }}
              />
              <div className="flex flex-col ml-2 text-left whitespace-nowrap">
                <span className="text-gray-700 font-normal text-lg overflow-ellipsis overflow-hidden w-16">
                  {currencyName}
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
                <input
                  ref={amountFieldRef}
                  value={amount?.toString()}
                  readOnly={readOnly}
                  onKeyPress={e => handleNumberInput(e)}
                  placeholder={toLocalFormat(0, { decimalPlaces: 2 })}
                  min={0}
                  style={{ padding: 0, borderRadius: 0 }}
                  className={classNames(
                    'appearance-none',
                    'w-full',
                    'py-3',
                    'border-2',
                    'border-gray-300',
                    'focus:border-primary-orange',
                    'bg-gray-100 focus:bg-transparent',
                    'focus:outline-none focus:shadow-outline',
                    'transition ease-in-out duration-200',
                    'rounded-md leading-tight placeholder-alphagray',
                    'text-gray-700 text-2xl text-right border-none bg-opacity-0',
                    'pl-0 focus:shadow-none'
                  )}
                  type="text"
                  maxLength={15}
                  disabled={amountInputDisabled}
                  onBlur={handleBlur}
                  onFocus={handleAmountFieldFocus}
                  onChange={onAmountChange}
                />
              </div>
            </div>
          </div>
        </div>
        {maxAmount && !opened && (
          <MaxAmountErrorComponent isMaxAmountError={isMaxAmountError} maxAmount={maxAmount} coin={currencyName} />
        )}
      </div>
    );
  }
);

interface MaxAmountErrorComponentProps {
  isMaxAmountError?: boolean;
  maxAmount?: string;
  coin: string;
}

const MaxAmountErrorComponent: React.FC<MaxAmountErrorComponentProps> = ({ isMaxAmountError, maxAmount, coin }) => (
  <div className="flex justify-end items-baseline mt-1">
    <p className={getSmallErrorText(isMaxAmountError)}>
      <CurrencyText className={getBigErrorText(isMaxAmountError)} coin={coin} maxAmount={maxAmount} />
    </p>
  </div>
);

const CurrencyText: React.FC<
  Omit<MaxAmountErrorComponentProps, 'isCoinFromType' | 'isMaxAmountError'> & { className: string }
> = ({ className, coin, maxAmount }) => (
  <>
    <T id={'max'} />
    {':'}
    <span className={classNames(className, 'text-sm')}> {maxAmount !== 'Infinity' ? maxAmount : '0'}</span>{' '}
    <span className={classNames(className, 'text-xs')}>{coin}</span>
  </>
);

import React, { ChangeEvent, forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';

import AssetField from 'app/atoms/AssetField';
import Money from 'app/atoms/Money';
import Spinner from 'app/atoms/Spinner';
import { ReactComponent as ChevronDownIcon } from 'app/icons/chevron-down.svg';
import { ReactComponent as SearchIcon } from 'app/icons/search.svg';
import { ReactComponent as SyncIcon } from 'app/icons/sync.svg';
import AssetIcon from 'app/templates/AssetIcon';
import { toLocalFormat } from 'lib/i18n/numbers';
import { t, T } from 'lib/i18n/react';
import { AssetMetadata, useNetwork } from 'lib/temple/front';
import { PopperRenderProps } from 'lib/ui/Popper';

import { SwapFormInputProps } from '../SwapFormInput.props';

interface Props extends PopperRenderProps, Pick<SwapFormInputProps, 'label'> {
  amount?: BigNumber;
  amountLoading?: boolean;
  balance?: BigNumber;
  onAmountChange: (amount?: BigNumber) => void;
  onInUSDToggle: () => void;
  onSearchChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onTokenIdChange: (value?: number) => void;
  searchString: string;
  selectedAssetSlug?: string;
  selectedAssetMetadata: AssetMetadata;
  canSwitchToUSD: boolean;
  showTokenIdInput: boolean;
  tokenId?: number;
  usdAmount?: BigNumber;
}

export const SwapFormInputHeader = forwardRef<HTMLDivElement, Props>(
  (
    {
      amount,
      amountLoading,
      balance,
      label,
      onAmountChange,
      onInUSDToggle,
      onSearchChange,
      onTokenIdChange,
      opened,
      searchString,
      selectedAssetSlug,
      selectedAssetMetadata,
      canSwitchToUSD,
      showTokenIdInput,
      tokenId,
      toggleOpened,
      usdAmount
    },
    ref
  ) => {
    const amountFieldRef = useRef<HTMLInputElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [isActive, setIsActive] = useState(false);
    const network = useNetwork();

    const displayedAmount = canSwitchToUSD ? usdAmount : amount;
    const displayedConversionNumber = canSwitchToUSD ? amount : usdAmount;
    const displayedBalance = useMemo(() => {
      return balance;
    }, [balance]);

    const prevOpenedRef = useRef(opened);
    useEffect(() => {
      if (!prevOpenedRef.current && opened) {
        searchInputRef.current?.focus();
      }
      prevOpenedRef.current = opened;
    }, [opened]);

    const handleFocus = () => setIsActive(true);
    const handleBlur = () => setIsActive(false);
    const handleAmountFieldFocus = useCallback(evt => {
      evt.preventDefault();
      setIsActive(true);
      amountFieldRef.current?.focus({ preventScroll: true });
    }, []);

    const handleChange = (newInputValue?: string) => {
      const newValue = newInputValue ? new BigNumber(newInputValue) : undefined;
      onAmountChange(newValue);
    };

    const handleTokenIdChange = (newValue?: string) => {
      const newValueNum = newValue ? Number(newValue) : undefined;
      onTokenIdChange(newValueNum);
    };

    return (
      <div className="w-full text-gray-700">
        <div className="w-full flex mb-1 items-center justify-between">
          <span className="text-xl text-gray-900">{label}</span>
          {selectedAssetSlug && (
            <span className={classNames(opened && 'hidden', 'text-xs text-gray-500')}>
              <span className="mr-1">
                <T id="balance" />
              </span>
              {displayedBalance && (
                <span className={classNames('text-sm mr-1 text-gray-700', displayedBalance.eq(0) && 'text-red-700')}>
                  {canSwitchToUSD ? '≈' : ''}
                  <Money smallFractionFont={false} fiat={canSwitchToUSD}>
                    {displayedBalance}
                  </Money>
                </span>
              )}
              <span>{canSwitchToUSD ? '$' : selectedAssetMetadata.symbol}</span>
            </span>
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
          <div className={classNames('w-full flex items-stretch', !opened && 'hidden')} style={{ height: '4.5rem' }}>
            <div className="items-center ml-5 mr-3 my-6">
              <SearchIcon className="w-6 h-auto text-gray-500 stroke-current stroke-2" />
            </div>
            <div className="text-lg flex flex-1 items-stretch">
              <div className="flex-1 flex items-stretch mr-2">
                <input
                  className="w-full px-2 bg-transparent"
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  value={searchString}
                  onChange={onSearchChange}
                  ref={searchInputRef}
                />
              </div>
              {showTokenIdInput && (
                <div className="w-24 flex items-stretch border-l border-gray-300">
                  <AssetField
                    containerClassName="items-stretch"
                    containerStyle={{ flexDirection: 'row' }}
                    fieldWrapperBottomMargin={false}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    value={tokenId}
                    className="text-lg border-none bg-opacity-0 focus:shadow-none"
                    onChange={handleTokenIdChange}
                    placeholder={t('tokenId')}
                    style={{ padding: '0 0.5rem', borderRadius: 0 }}
                    assetDecimals={0}
                  />
                </div>
              )}
            </div>
          </div>
          <div className={classNames('w-full flex items-stretch', opened && 'hidden')} style={{ height: '4.5rem' }}>
            <div
              className="border-r border-gray-300 pl-4 pr-3 flex py-5 items-center cursor-pointer"
              onClick={toggleOpened}
            >
              {selectedAssetSlug ? (
                <>
                  <AssetIcon assetSlug={selectedAssetSlug} size={32} className="mr-2" />
                  <span
                    className="text-gray-700 text-lg mr-2 items-center overflow-hidden block w-16"
                    style={{ textOverflow: 'ellipsis' }}
                  >
                    {selectedAssetMetadata.symbol}
                  </span>
                </>
              ) : (
                <div className="w-24 mr-4 text-gray-500 text-sm font-medium leading-tight">
                  <div className="w-12">
                    <T id="selectToken" />
                  </div>
                </div>
              )}

              <ChevronDownIcon className="w-4 h-auto text-gray-700 stroke-current stroke-2" />
            </div>
            <div className="flex-1 px-2 flex items-center justify-between">
              {canSwitchToUSD && (
                <button
                  type="button"
                  className="mr-2"
                  onClick={onInUSDToggle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                >
                  <SyncIcon className="w-4 h-auto text-gray-700 stroke-current stroke-1" />
                </button>
              )}
              <div
                className={classNames(
                  'h-full flex-1 flex items-end justify-center flex-col',
                  amountLoading && 'hidden'
                )}
              >
                <AssetField
                  fieldWrapperBottomMargin={false}
                  value={displayedAmount?.toString()}
                  ref={amountFieldRef}
                  onBlur={handleBlur}
                  onFocus={handleAmountFieldFocus}
                  className={classNames(
                    'text-gray-700 text-2xl text-right border-none bg-opacity-0',
                    'pl-0 focus:shadow-none'
                  )}
                  onChange={handleChange}
                  placeholder={toLocalFormat(0, { decimalPlaces: 2 })}
                  style={{ padding: 0, borderRadius: 0 }}
                  min={0}
                  assetDecimals={canSwitchToUSD ? 2 : selectedAssetMetadata.decimals}
                />
                {network.type === 'main' && (
                  <span
                    className={classNames(
                      'mt-2 text-xs',
                      displayedConversionNumber === undefined ? 'text-gray-500' : 'text-gray-700'
                    )}
                  >
                    ≈{' '}
                    <Money smallFractionFont={false} fiat={!canSwitchToUSD}>
                      {displayedConversionNumber ?? 0}
                    </Money>
                    <span className="text-gray-500">{` ${canSwitchToUSD ? selectedAssetMetadata.symbol : '$'}`}</span>
                  </span>
                )}
              </div>
              <div
                className={classNames(
                  'h-full flex-1 flex items-end justify-center flex-col',
                  !amountLoading && 'hidden'
                )}
              >
                <Spinner theme="primary" style={{ width: '3rem' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

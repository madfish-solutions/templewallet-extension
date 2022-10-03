import React, { ChangeEvent, forwardRef, FocusEvent, useEffect, useRef, useState } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';

import AssetField from 'app/atoms/AssetField';
import Money from 'app/atoms/Money';
import { ReactComponent as ChevronDownIcon } from 'app/icons/chevron-down.svg';
import { ReactComponent as SearchIcon } from 'app/icons/search.svg';
import { AssetIcon } from 'app/templates/AssetIcon';
import InFiat from 'app/templates/InFiat';
import { toLocalFormat } from 'lib/i18n/numbers';
import { t, T } from 'lib/i18n/react';
import { AssetMetadata } from 'lib/temple/metadata';
import { PopperRenderProps } from 'lib/ui/Popper';

import { SwapFormInputProps } from '../SwapFormInput.props';

interface Props extends PopperRenderProps, Pick<SwapFormInputProps, 'label'> {
  amount?: BigNumber;
  balance?: BigNumber;
  searchString: string;
  selectedAssetSlug?: string;
  selectedAssetMetadata: AssetMetadata;
  showTokenIdInput: boolean;
  tokenId?: number;
  amountInputDisabled?: boolean;
  onTokenIdChange: (value?: number) => void;
  onAmountChange: (amount?: BigNumber) => void;
  onSearchChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const SwapFormInputHeader = forwardRef<HTMLDivElement, Props>(
  (
    {
      amount,
      balance,
      label,
      opened,
      searchString,
      selectedAssetSlug,
      selectedAssetMetadata,
      showTokenIdInput,
      tokenId,
      toggleOpened,
      amountInputDisabled,
      onTokenIdChange,
      onAmountChange,
      onSearchChange
    },
    ref
  ) => {
    const amountFieldRef = useRef<HTMLInputElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [isActive, setIsActive] = useState(false);

    const prevOpenedRef = useRef(opened);

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
            <span className={classNames(opened && 'hidden', 'text-xs text-gray-500 flex items-baseline')}>
              <span className="mr-1">
                <T id="balance" />
              </span>
              {balance && (
                <span className={classNames('text-sm mr-1 text-gray-700', balance.eq(0) && 'text-red-700')}>
                  <Money smallFractionFont={false} fiat={false}>
                    {balance}
                  </Money>
                </span>
              )}
              <span>{selectedAssetMetadata.symbol}</span>
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
                  ref={searchInputRef}
                  value={searchString}
                  className="w-full px-2 bg-transparent"
                  placeholder={t('swapTokenSearchInputPlaceholder')}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  onChange={onSearchChange}
                />
              </div>
              {showTokenIdInput && (
                <div className="w-24 flex items-stretch border-l border-gray-300">
                  <AssetField
                    value={tokenId}
                    assetDecimals={0}
                    fieldWrapperBottomMargin={false}
                    placeholder={t('tokenId')}
                    style={{ padding: '0 0.5rem', borderRadius: 0 }}
                    containerStyle={{ flexDirection: 'row' }}
                    containerClassName="items-stretch"
                    className="text-lg border-none bg-opacity-0 focus:shadow-none"
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    onChange={handleTokenIdChange}
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
                  className={classNames(
                    'text-gray-700 text-2xl text-right border-none bg-opacity-0',
                    'pl-0 focus:shadow-none'
                  )}
                  style={{ padding: 0, borderRadius: 0 }}
                  placeholder={toLocalFormat(0, { decimalPlaces: 2 })}
                  min={0}
                  disabled={amountInputDisabled}
                  assetDecimals={selectedAssetMetadata.decimals}
                  fieldWrapperBottomMargin={false}
                  onBlur={handleBlur}
                  onFocus={handleAmountFieldFocus}
                  onChange={handleAmountChange}
                />

                <InFiat
                  assetSlug={selectedAssetSlug}
                  volume={selectedAssetSlug ? amount ?? 0 : 0}
                  smallFractionFont={false}
                >
                  {({ balance, symbol }) => (
                    <div className="text-gray-500 flex">
                      <span className="mr-1">≈</span>
                      {balance}
                      <span className="ml-1">{symbol}</span>
                    </div>
                  )}
                </InFiat>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

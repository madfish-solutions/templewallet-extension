import React, { ChangeEvent, FC, ReactNode, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';
import BigNumber from 'bignumber.js';
import classNames from 'clsx';

import AssetField from 'app/atoms/AssetField';
import Money from 'app/atoms/Money';
import { useTokensListingLogic } from 'app/hooks/use-tokens-listing-logic';
import { AssetIcon } from 'app/templates/AssetIcon';
import { DropdownSelect } from 'app/templates/DropdownSelect/DropdownSelect';
import InFiat from 'app/templates/InFiat';
import { InputContainer } from 'app/templates/InputContainer/InputContainer';
import { setTestID, useFormAnalytics } from 'lib/analytics';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { useBalance, useRawBalance } from 'lib/balances';
import { T, t, toLocalFormat } from 'lib/i18n';
import {
  EMPTY_BASE_METADATA,
  useAssetMetadata,
  useGetAssetMetadata,
  AssetMetadataBase,
  useTokensMetadataPresenceCheck
} from 'lib/metadata';
import { useAvailableRoute3TokensSlugs } from 'lib/route3/assets';
import { useAccount } from 'lib/temple/front';

import { AssetOption } from './AssetsMenu/AssetOption';
import { PercentageButton } from './PercentageButton/PercentageButton';
import { SwapFormInputProps } from './SwapFormInput.props';

const EXCHANGE_XTZ_RESERVE = new BigNumber('0');
const PERCENTAGE_BUTTONS = [25, 50, 75, 100];
const LEADING_ASSETS = [TEZ_TOKEN_SLUG];

const renderOptionContent = (option: string, isSelected: boolean) => (
  <AssetOption assetSlug={option} selected={isSelected} />
);

export const SwapFormInput: FC<SwapFormInputProps> = ({
  className,
  value,
  label,
  error,
  name,
  amountInputDisabled,
  testIDs,
  onChange,
  noItemsText = 'No items'
}) => {
  const { trackChange } = useFormAnalytics('SwapForm');

  const { assetSlug, amount } = value;
  const isTezosSlug = assetSlug === TEZ_TOKEN_SLUG;
  const assetSlugWithFallback = assetSlug ?? TEZ_TOKEN_SLUG;

  const assetMetadataWithFallback = useAssetMetadata(assetSlugWithFallback)!;
  const assetMetadata = useMemo(
    () => (assetSlug ? assetMetadataWithFallback : EMPTY_BASE_METADATA),
    [assetSlug, assetMetadataWithFallback]
  );
  const getTokenMetadata = useGetAssetMetadata();

  const { publicKeyHash } = useAccount();
  const { value: balance } = useBalance(assetSlugWithFallback, publicKeyHash);

  const { isLoading, route3tokensSlugs } = useAvailableRoute3TokensSlugs();
  const { filteredAssets, searchValue, setSearchValue, setTokenId } = useTokensListingLogic(
    route3tokensSlugs,
    name === 'input',
    LEADING_ASSETS
  );

  useTokensMetadataPresenceCheck(route3tokensSlugs);

  const maxAmount = useMemo(() => {
    if (!assetSlug) {
      return new BigNumber(0);
    }

    const maxSendAmount = isTezosSlug ? balance?.minus(EXCHANGE_XTZ_RESERVE) : balance;

    return maxSendAmount ?? new BigNumber(0);
  }, [assetSlug, isTezosSlug, balance]);

  const handleAmountChange = (newAmount?: BigNumber) =>
    onChange({
      assetSlug,
      amount: newAmount
    });

  const handlePercentageClick = (percentage: number) => {
    if (!assetSlug) {
      return;
    }
    const newAmount = maxAmount
      .multipliedBy(percentage)
      .div(100)
      .decimalPlaces(assetMetadata.decimals, BigNumber.ROUND_DOWN);

    handleAmountChange(newAmount);
  };

  const handleSelectedAssetChange = (newAssetSlug: string) => {
    const newAssetMetadata = getTokenMetadata(newAssetSlug)!;
    const newAmount = amount?.decimalPlaces(newAssetMetadata.decimals, BigNumber.ROUND_DOWN);

    onChange({
      assetSlug: newAssetSlug,
      amount: newAmount
    });
    setSearchValue('');
    setTokenId(undefined);

    trackChange({ [name]: assetMetadata.symbol }, { [name]: newAssetMetadata.symbol });
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTokenId(undefined);
    setSearchValue(e.target.value);
  };

  const prettyError = useMemo(() => {
    if (!error) {
      return error;
    }
    if (error.startsWith('maximalAmount')) {
      const amountAsset = new BigNumber(error.split(':')[1]);
      return t('maximalAmount', amountAsset.toFixed());
    }

    return error;
  }, [error]);

  return (
    <div className={className}>
      <InputContainer
        header={
          <SwapInputHeader
            label={label}
            selectedAssetSlug={assetSlug}
            selectedAssetSymbol={assetMetadataWithFallback.symbol}
          />
        }
        footer={
          <div className={classNames('w-full flex items-center', prettyError ? 'justify-between' : 'justify-end')}>
            {prettyError && <div className="text-red-700 text-xs">{prettyError}</div>}
            <SwapFooter
              amountInputDisabled={Boolean(amountInputDisabled)}
              selectedAssetSlug={assetSlugWithFallback}
              handlePercentageClick={handlePercentageClick}
            />
          </div>
        }
      >
        <DropdownSelect
          testID={testIDs?.dropdown}
          dropdownButtonClassName="pl-4 pr-3 py-5"
          DropdownFaceContent={
            <SwapDropdownFace
              testId={testIDs?.assetDropDownButton}
              selectedAssetSlug={assetSlug}
              selectedAssetMetadata={assetMetadata}
            />
          }
          searchProps={{
            searchValue,
            testId: testIDs?.searchInput,
            onSearchChange: handleSearchChange
          }}
          Input={
            <SwapInput
              testId={testIDs?.input}
              amount={value.amount}
              amountInputDisabled={Boolean(amountInputDisabled)}
              onChange={handleAmountChange}
              selectedAssetSlug={assetSlugWithFallback}
              selectedAssetMetadata={assetMetadata}
            />
          }
          optionsProps={{
            isLoading,
            options: filteredAssets,
            noItemsText,
            getKey: option => option,
            renderOptionContent: option => renderOptionContent(option, value.assetSlug === option),
            onOptionChange: handleSelectedAssetChange
          }}
        />
      </InputContainer>
    </div>
  );
};

interface SwapFieldProps {
  testId?: string;
  selectedAssetSlug?: string;
  selectedAssetMetadata: AssetMetadataBase;
}

const SwapDropdownFace: FC<SwapFieldProps> = ({ testId, selectedAssetSlug, selectedAssetMetadata }) => (
  <div {...setTestID(testId)} className="max-h-18">
    {selectedAssetSlug ? (
      <div className="flex gap-2 align-center">
        <AssetIcon assetSlug={selectedAssetSlug} size={32} className="w-8" />
        <span className="text-gray-700 text-lg overflow-hidden w-16 leading-8 text-ellipsis">
          {selectedAssetMetadata.symbol}
        </span>
      </div>
    ) : (
      <div className="w-24 mr-2 text-gray-500 text-sm font-medium leading-tight">
        <div className="w-12">
          <T id="selectToken" />
        </div>
      </div>
    )}
  </div>
);

interface SwapInputProps extends SwapFieldProps {
  testId?: string;
  amount: BigNumber | undefined;
  amountInputDisabled: boolean;
  onChange: (value?: BigNumber) => void;
}
const SwapInput: FC<SwapInputProps> = ({
  amount,
  amountInputDisabled,
  selectedAssetSlug,
  selectedAssetMetadata,
  testId,
  onChange
}) => {
  const handleAmountChange = (newAmount?: string) =>
    onChange(Boolean(newAmount) && isDefined(newAmount) ? new BigNumber(newAmount) : undefined);

  return (
    <div
      className={classNames(
        'flex-1 px-2 flex items-center justify-between rounded-r-md h-18',
        amountInputDisabled && 'bg-gray-100'
      )}
    >
      <div className="h-full flex-1 flex items-end justify-center flex-col">
        <AssetField
          autoFocus
          testID={testId}
          value={amount?.toString()}
          className="text-gray-700 text-2xl text-right border-none bg-opacity-0 pl-0 focus:shadow-none"
          style={{ padding: 0, borderRadius: 0 }}
          placeholder={toLocalFormat(0, { decimalPlaces: 2 })}
          min={0}
          disabled={amountInputDisabled}
          assetDecimals={selectedAssetMetadata.decimals}
          fieldWrapperBottomMargin={false}
          onChange={handleAmountChange}
        />

        <InFiat assetSlug={selectedAssetSlug} volume={selectedAssetSlug ? amount ?? 0 : 0} smallFractionFont={false}>
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
  );
};

const SwapInputHeader: FC<{ label: ReactNode; selectedAssetSlug?: string; selectedAssetSymbol: string }> = ({
  selectedAssetSlug,
  selectedAssetSymbol,
  label
}) => {
  const { publicKeyHash } = useAccount();
  const { value: balance } = useBalance(selectedAssetSlug ?? TEZ_TOKEN_SLUG, publicKeyHash);

  return (
    <div className="w-full flex items-center justify-between">
      <span className="text-xl text-gray-900">{label}</span>

      {selectedAssetSlug && (
        <span className="text-xs text-gray-500 flex items-baseline">
          <span className="mr-1">
            <T id="balance" />:
          </span>

          {balance && (
            <span className={classNames('text-sm mr-1 text-gray-700', balance.isZero() && 'text-red-700')}>
              <Money smallFractionFont={false} fiat={false}>
                {balance}
              </Money>
            </span>
          )}

          <span>{selectedAssetSymbol}</span>
        </span>
      )}
    </div>
  );
};

const SwapFooter: FC<{
  amountInputDisabled: boolean;
  selectedAssetSlug: string;
  handlePercentageClick: (percentage: number) => void;
}> = ({ amountInputDisabled, selectedAssetSlug, handlePercentageClick }) => {
  const { publicKeyHash } = useAccount();
  const { value: balance } = useRawBalance(selectedAssetSlug, publicKeyHash);

  return amountInputDisabled ? null : (
    <div className="flex">
      {PERCENTAGE_BUTTONS.map(percentage => (
        <PercentageButton
          disabled={!balance}
          key={percentage}
          percentage={percentage}
          onClick={handlePercentageClick}
        />
      ))}
    </div>
  );
};

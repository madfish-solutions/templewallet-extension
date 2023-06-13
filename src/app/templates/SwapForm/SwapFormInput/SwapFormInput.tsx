import React, { ChangeEvent, FC, ReactNode, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';
import BigNumber from 'bignumber.js';
import classNames from 'clsx';

import AssetField from 'app/atoms/AssetField';
import Money from 'app/atoms/Money';
import { AssetIcon } from 'app/templates/AssetIcon';
import InFiat from 'app/templates/InFiat';
import { InputGeneral } from 'app/templates/InputGeneral/InputGeneral';
import { SelectGeneral } from 'app/templates/InputGeneral/SelectGeneral';
import { setTestID, useFormAnalytics } from 'lib/analytics';
import { T, t, toLocalFormat } from 'lib/i18n';
import { EMPTY_BASE_METADATA, useAssetMetadata, AssetMetadataBase } from 'lib/metadata';
import { useAccount, useBalance, useGetTokenMetadata, useOnBlock } from 'lib/temple/front';
import { useAvailableRoute3Tokens, useFilteredSwapAssets } from 'lib/temple/front/assets';

import { AssetOption } from './AssetsMenu/AssetOption';
import { PercentageButton } from './PercentageButton/PercentageButton';
import { SwapFormInputProps } from './SwapFormInput.props';

const EXCHANGE_XTZ_RESERVE = new BigNumber('0.3');
const PERCENTAGE_BUTTONS = [25, 50, 75, 100];

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
  onChange
}) => {
  const { trackChange } = useFormAnalytics('SwapForm');

  const { assetSlug, amount } = value;
  const isTezosSlug = assetSlug === 'tez';
  const assetSlugWithFallback = assetSlug ?? 'tez';

  const assetMetadataWithFallback = useAssetMetadata(assetSlugWithFallback)!;
  const assetMetadata = useMemo(
    () => (assetSlug ? assetMetadataWithFallback : EMPTY_BASE_METADATA),
    [assetSlug, assetMetadataWithFallback]
  );
  const getTokenMetadata = useGetTokenMetadata();

  const account = useAccount();
  const balance = useBalance(assetSlugWithFallback, account.publicKeyHash, { suspense: false });
  useOnBlock(_ => balance.mutate());

  const { isLoading } = useAvailableRoute3Tokens();
  const { filteredAssets, searchValue, setSearchValue, setTokenId } = useFilteredSwapAssets(name);

  const maxAmount = useMemo(() => {
    if (!assetSlug) {
      return new BigNumber(0);
    }

    const maxSendAmount = isTezosSlug ? balance.data?.minus(EXCHANGE_XTZ_RESERVE) : balance.data;

    return maxSendAmount ?? new BigNumber(0);
  }, [assetSlug, isTezosSlug, balance.data]);

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
      <InputGeneral
        header={
          <SwapInputHeader
            label={label}
            selectedAssetSlug={assetSlugWithFallback}
            selectedAssetSymbol={assetMetadataWithFallback.symbol}
          />
        }
        mainContent={
          <SelectGeneral
            testIds={{
              dropdownTestId: testIDs?.dropdown,
              searchInputTestId: testIDs?.searchInput
            }}
            dropdownButtonClassName="pl-4 pr-3 py-5"
            DropdownFaceContent={
              <SwapDropdownFace
                testId={testIDs?.assetSelector}
                selectedAssetSlug={assetSlug}
                selectedAssetMetadata={assetMetadata}
              />
            }
            searchProps={{
              searchValue,
              onSearchChange: handleSearchChange
            }}
            Input={
              <SwapInput
                testId={testIDs?.input}
                amount={value.amount}
                amountInputDisabled={Boolean(amountInputDisabled)}
                onChange={handleAmountChange}
                selectedAssetMetadata={assetMetadata}
              />
            }
            optionsProps={{
              isLoading,
              options: filteredAssets,
              noItemsText: 'No items',
              renderOptionContent: option => renderOptionContent(option, value.assetSlug === option),
              onOptionChange: handleSelectedAssetChange
            }}
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
      />
    </div>
  );
};

interface SwapFieldProps {
  testId?: string;
  selectedAssetSlug?: string;
  selectedAssetMetadata: AssetMetadataBase;
}

const SwapDropdownFace: FC<SwapFieldProps> = ({ testId, selectedAssetSlug, selectedAssetMetadata }) => (
  <div {...setTestID(testId)}>
    {selectedAssetSlug ? (
      <div className="flex gap-2 align-center">
        <AssetIcon assetSlug={selectedAssetSlug} size={32} className="w-8" />
        <span className="text-gray-700 text-lg overflow-hidden w-16 leading-8" style={{ textOverflow: 'ellipsis' }}>
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

const SwapInputHeader: FC<{ label: ReactNode; selectedAssetSlug: string; selectedAssetSymbol: string }> = ({
  selectedAssetSlug,
  selectedAssetSymbol,
  label
}) => {
  const account = useAccount();
  const balance = useBalance(selectedAssetSlug, account.publicKeyHash, { suspense: false });
  useOnBlock(_ => balance.mutate());

  return (
    <div className="w-full flex items-center justify-between">
      <span className="text-xl text-gray-900">{label}</span>

      {selectedAssetSlug && (
        <span className="text-xs text-gray-500 flex items-baseline">
          <span className="mr-1">
            <T id="balance" />:
          </span>
          {balance.data && (
            <span className={classNames('text-sm mr-1 text-gray-700', balance.data.eq(0) && 'text-red-700')}>
              <Money smallFractionFont={false} fiat={false}>
                {balance.data}
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
  const account = useAccount();
  const balance = useBalance(selectedAssetSlug, account.publicKeyHash, { suspense: false });
  useOnBlock(_ => balance.mutate());

  return amountInputDisabled ? null : (
    <div className="flex">
      {PERCENTAGE_BUTTONS.map(percentage => (
        <PercentageButton
          disabled={!balance.data}
          key={percentage}
          percentage={percentage}
          onClick={handlePercentageClick}
        />
      ))}
    </div>
  );
};

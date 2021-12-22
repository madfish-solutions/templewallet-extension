import React, { ChangeEvent, FC, useCallback, useMemo, useState } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';

import { useFormAnalytics } from 'lib/analytics';
import { t } from 'lib/i18n/react';
import {
  AssetTypesEnum,
  EMPTY_ASSET_METADATA,
  EXCHANGE_XTZ_RESERVE,
  toTokenSlug,
  useAccount,
  useAssetMetadata,
  useAvailableAssets,
  useBalance,
  useFilteredAssets,
  useGetTokenMetadata,
  useOnBlock,
  useTokensMetadata
} from 'lib/temple/front';
import Popper from 'lib/ui/Popper';

import { AssetsMenu } from './AssetsMenu/AssetsMenu';
import { PercentageButton } from './PercentageButton/PercentageButton';
import { sameWidthModifiers } from './SwapFormInput.pooper';
import { SwapFormInputProps } from './SwapFormInput.props';
import { SwapFormInputHeader } from './SwapFormInputHeader/SwapFormInputHeader';
import { useSwapFormTokenIdInput } from './SwapFormTokenIdInput.hook';

const PERCENTAGE_BUTTONS = [25, 50, 75, 100];

export const SwapFormInput: FC<SwapFormInputProps> = ({
  value,
  className,
  error,
  label,
  loading,
  isOutput = false,
  name,
  triggerValidation,
  withPercentageButtons,
  onChange
}) => {
  const { trackChange } = useFormAnalytics('SwapForm');
  const { assetSlug, amount, usdAmount } = value;
  const isTezosSlug = assetSlug === 'tez';
  const assetSlugWithFallback = assetSlug ?? 'tez';

  const assetMetadataWithFallback = useAssetMetadata(assetSlugWithFallback);
  const assetMetadata = useMemo(
    () => (assetSlug ? assetMetadataWithFallback : EMPTY_ASSET_METADATA),
    [assetSlug, assetMetadataWithFallback]
  );
  const getTokenMetadata = useGetTokenMetadata();

  const account = useAccount();
  const balance = useBalance(assetSlugWithFallback, account.publicKeyHash, { suspense: false });
  useOnBlock(balance.revalidate);

  const { availableAssets, assetsStatuses, isLoading, revalidate } = useAvailableAssets(AssetTypesEnum.Tokens);
  const availableAssetsWithTezos = useMemo(() => ['tez', ...availableAssets], [availableAssets]);
  const { filteredAssets, searchValue, setSearchValue, tokenId, setTokenId } =
    useFilteredAssets(availableAssetsWithTezos);

  const showTokenIdInput = useSwapFormTokenIdInput(searchValue);
  const searchAssetSlug = toTokenSlug(searchValue, tokenId);

  const maxAmount = useMemo(() => {
    if (!assetSlug) {
      return new BigNumber(0);
    }

    if (isOutput) {
      return new BigNumber(Infinity);
    }

    const maxSendAmount = isTezosSlug ? balance.data?.minus(EXCHANGE_XTZ_RESERVE) : balance.data;

    return maxSendAmount ?? new BigNumber(0);
  }, [assetSlug, isTezosSlug, balance, isOutput]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTokenId(undefined);
    setSearchValue(e.target.value);
  };

  const handleAmountChange = (amount?: BigNumber, usdAmount?: BigNumber) =>
    onChange({
      assetSlug,
      amount,
      usdAmount
    });

  const handlePercentageClick = (percentage: number) => {
    if (!assetSlug) {
      return;
    }
    const newAmount = maxAmount
      .multipliedBy(percentage)
      .div(100)
      .decimalPlaces(assetMetadata.decimals, BigNumber.ROUND_DOWN);
    onChange({
      assetSlug,
      amount: newAmount
    });
    triggerValidation(name);
  };

  const handleSelectedAssetChange = (newAssetSlug: string) => {
    const newAssetMetadata = getTokenMetadata(newAssetSlug);
    const newAmount = amount?.decimalPlaces(newAssetMetadata.decimals, BigNumber.ROUND_DOWN);

    onChange({
      assetSlug: newAssetSlug,
      amount: newAmount
    });
    setSearchValue('');
    setTokenId(undefined);

    trackChange({ [name]: assetMetadata.symbol }, { [name]: newAssetMetadata.symbol });
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
    <div className={classNames('w-full', className)}>
      <input className="hidden" name={name} />
      <Popper
        placement="bottom"
        strategy="fixed"
        modifiers={sameWidthModifiers}
        fallbackPlacementsEnabled={false}
        popup={({ opened, setOpened }) => (
          <AssetsMenu
            value={assetSlug}
            options={filteredAssets}
            isLoading={isLoading}
            searchString={searchValue}
            searchAssetSlug={searchAssetSlug}
            showTokenIdInput={showTokenIdInput}
            opened={opened}
            setOpened={setOpened}
            onChange={handleSelectedAssetChange}
          />
        )}
      >
        {({ ref, opened, toggleOpened, setOpened }) => (
          <SwapFormInputHeader
            ref={ref as unknown as React.RefObject<HTMLDivElement>}
            selectedAssetSlug={assetSlug}
            selectedAssetMetadata={assetMetadata}
            amount={amount}
            amountLoading={loading}
            balance={assetSlug ? balance.data : undefined}
            label={label}
            opened={opened}
            searchString={searchValue}
            setOpened={setOpened}
            canSwitchToUSD={false}
            showTokenIdInput={showTokenIdInput}
            tokenId={tokenId}
            toggleOpened={toggleOpened}
            usdAmount={usdAmount}
            onInUSDToggle={() => void 0}
            onTokenIdChange={setTokenId}
            onAmountChange={handleAmountChange}
            onSearchChange={handleSearchChange}
          />
        )}
      </Popper>
      <div
        className={classNames(
          withPercentageButtons && 'mt-1',
          'w-full flex items-center',
          prettyError ? 'justify-between' : 'justify-end'
        )}
      >
        {prettyError && <div className="text-red-700 text-xs">{prettyError}</div>}
        {withPercentageButtons && (
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
        )}
      </div>
    </div>
  );
};

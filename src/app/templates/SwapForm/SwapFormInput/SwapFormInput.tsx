import React, { ChangeEvent, FC, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';

import { useFormAnalytics } from 'lib/analytics';
import { t } from 'lib/i18n';
import { EMPTY_BASE_METADATA, useAssetMetadata } from 'lib/metadata';
import { useAccount, useBalance, useGetTokenMetadata, useOnBlock } from 'lib/temple/front';
import { useAvailableRoute3Tokens, useFilteredSwapAssets } from 'lib/temple/front/assets';
import Popper from 'lib/ui/Popper';
import { sameWidthModifiers } from 'lib/ui/same-width-modifiers';

import { AssetsMenu } from './AssetsMenu/AssetsMenu';
import { PercentageButton } from './PercentageButton/PercentageButton';
import { SwapFormInputProps } from './SwapFormInput.props';
import { SwapFormInputHeader } from './SwapFormInputHeader/SwapFormInputHeader';
import { useSwapFormTokenIdInput } from './SwapFormTokenIdInput.hook';

const EXCHANGE_XTZ_RESERVE = new BigNumber('0.3');
const PERCENTAGE_BUTTONS = [25, 50, 75, 100];

export const SwapFormInput: FC<SwapFormInputProps> = ({
  value,
  className,
  error,
  label,
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
  const { filteredAssets, searchValue, setSearchValue, tokenId, setTokenId } = useFilteredSwapAssets(name);

  const showTokenIdInput = useSwapFormTokenIdInput(searchValue);

  const maxAmount = useMemo(() => {
    if (!assetSlug) {
      return new BigNumber(0);
    }

    const maxSendAmount = isTezosSlug ? balance.data?.minus(EXCHANGE_XTZ_RESERVE) : balance.data;

    return maxSendAmount ?? new BigNumber(0);
  }, [assetSlug, isTezosSlug, balance.data]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTokenId(undefined);
    setSearchValue(e.target.value);
  };

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
      <input className="hidden" name={name} disabled={amountInputDisabled} />

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
            showTokenIdInput={showTokenIdInput}
            opened={opened}
            testID={testIDs?.dropdown}
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
            balance={assetSlug ? balance.data : undefined}
            label={label}
            opened={opened}
            searchString={searchValue}
            setOpened={setOpened}
            showTokenIdInput={showTokenIdInput}
            tokenId={tokenId}
            toggleOpened={toggleOpened}
            onTokenIdChange={setTokenId}
            amountInputDisabled={amountInputDisabled}
            onAmountChange={handleAmountChange}
            onSearchChange={handleSearchChange}
            testIDs={testIDs}
          />
        )}
      </Popper>

      <div
        className={classNames(
          !amountInputDisabled && 'mt-1',
          'w-full flex items-center',
          prettyError ? 'justify-between' : 'justify-end'
        )}
      >
        {prettyError && <div className="text-red-700 text-xs">{prettyError}</div>}

        {!amountInputDisabled && (
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

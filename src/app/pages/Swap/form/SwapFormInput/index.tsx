import React, { FC, useCallback, useMemo } from 'react';

import BigNumber from 'bignumber.js';

import SwapInput from 'app/pages/Swap/form/SwapFormInput/SwapInput';
import SwapInputHeader from 'app/pages/Swap/form/SwapFormInput/SwapInputHeader';
import { InputContainer } from 'app/templates/InputContainer/InputContainer';
import { useFormAnalytics } from 'lib/analytics';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { useTezosAssetBalance } from 'lib/balances';
import { useAssetFiatCurrencyPrice, useFiatCurrency } from 'lib/fiat-currency';
import {
  useCategorizedTezosAssetMetadata,
  useGetCategorizedAssetMetadata,
  AssetMetadataBase,
  useTezosTokensMetadataPresenceCheck
} from 'lib/metadata';
import { useAvailableRoute3TokensSlugs } from 'lib/route3/assets';
import { useBooleanState } from 'lib/ui/hooks';

import { EXCHANGE_XTZ_RESERVE } from '../../constants';
import { SwapSelectAssetModal } from '../../modals/SwapSelectAsset';

import { SwapFormInputProps } from './SwapFormInput.props';

/** @deprecated // Bad practice */
const DEFAULT_ASSET_METADATA: AssetMetadataBase = {
  decimals: 0,
  symbol: '',
  name: '',
  thumbnailUri: ''
};

const SwapFormInput: FC<SwapFormInputProps> = ({
  network,
  publicKeyHash,
  className,
  error,
  value: { assetSlug, amount },
  label,
  inputName,
  readOnly,
  testIDs,
  onChange,
  shouldUseFiat = false,
  setShouldUseFiat = () => {}
}) => {
  const { trackChange } = useFormAnalytics('SwapForm');

  const isTezosSlug = assetSlug === TEZ_TOKEN_SLUG;
  const assetSlugWithFallback = assetSlug ?? TEZ_TOKEN_SLUG;

  const assetMetadataWithFallback = useCategorizedTezosAssetMetadata(assetSlugWithFallback, network.chainId)!;
  const assetMetadata = useMemo(
    () => (assetSlug ? assetMetadataWithFallback : DEFAULT_ASSET_METADATA),
    [assetSlug, assetMetadataWithFallback]
  );

  const { selectedFiatCurrency } = useFiatCurrency();
  const assetPrice = useAssetFiatCurrencyPrice(assetSlugWithFallback, network.chainId);
  const getTokenMetadata = useGetCategorizedAssetMetadata(network.chainId);
  const { value: balance } = useTezosAssetBalance(assetSlugWithFallback, publicKeyHash, network);
  const { route3tokensSlugs } = useAvailableRoute3TokensSlugs();

  useTezosTokensMetadataPresenceCheck(network.rpcBaseURL, route3tokensSlugs);

  const maxAmount = useMemo(() => {
    if (!assetSlug) return new BigNumber(0);
    return (isTezosSlug ? balance?.minus(EXCHANGE_XTZ_RESERVE) : balance) ?? new BigNumber(0);
  }, [assetSlug, isTezosSlug, balance]);

  const handleAmountChange = useCallback(
    (newAmount = new BigNumber(0), useFiat = shouldUseFiat) => {
      onChange({ assetSlug, amount: newAmount }, useFiat);
    },
    [assetSlug, onChange, shouldUseFiat]
  );

  const handleSetMaxAmount = useCallback(() => {
    if (assetSlug && maxAmount) handleAmountChange(maxAmount);
  }, [assetSlug, maxAmount, handleAmountChange]);

  const [selectAssetModalOpened, setSelectAssetModalOpen, setSelectAssetModalClosed] = useBooleanState(false);

  const handleAssetSelect = useCallback(
    (chainSlug: string) => {
      const newAssetSlug = parseChainAssetSlug(chainSlug)[2];
      const newAssetMetadata = getTokenMetadata(newAssetSlug);
      if (!newAssetMetadata) return setSelectAssetModalClosed();
      const newAmount = amount?.decimalPlaces(newAssetMetadata.decimals, BigNumber.ROUND_DOWN);

      onChange({
        assetSlug: newAssetSlug,
        amount: newAmount
      });
      setSelectAssetModalClosed();
      trackChange({ [inputName]: assetMetadata.symbol }, { [inputName]: newAssetMetadata.symbol });
    },
    [amount, assetMetadata?.symbol, getTokenMetadata, inputName, onChange, setSelectAssetModalClosed, trackChange]
  );

  const handleFiatToggle = useCallback(
    (evt: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      evt.preventDefault();

      const newShouldUseFiat = !shouldUseFiat;
      setShouldUseFiat(newShouldUseFiat);

      if (!amount) return;

      const amountBN = new BigNumber(amount);
      const formattedAmount = newShouldUseFiat
        ? amountBN.times(assetPrice).decimalPlaces(2, BigNumber.ROUND_FLOOR)
        : new BigNumber(amountBN.div(assetPrice)).decimalPlaces(assetMetadata.decimals, BigNumber.ROUND_FLOOR);

      handleAmountChange(formattedAmount, newShouldUseFiat);
    },
    [shouldUseFiat, setShouldUseFiat, amount, handleAmountChange, assetPrice, assetMetadata.decimals]
  );

  return (
    <div className={className}>
      <InputContainer
        className="px-4 py-5 bg-white rounded-8 shadow-md p-4"
        header={
          <SwapInputHeader
            label={label}
            inputName={inputName}
            isBalanceError={Boolean(amount && maxAmount.lt(amount))}
            assetDecimals={assetMetadata.decimals}
            handleSetMaxAmount={handleSetMaxAmount}
            assetBalanceStr={assetSlug ? balance?.toString() ?? '0' : undefined}
          />
        }
      >
        <SwapInput
          inputName={inputName}
          tezosChainId={network.chainId}
          amount={amount}
          readOnly={Boolean(readOnly)}
          error={error}
          assetPrice={assetPrice}
          assetSlug={assetSlug}
          assetMetadata={assetMetadata}
          shouldUseFiat={shouldUseFiat}
          fiatCurrency={selectedFiatCurrency}
          onChange={handleAmountChange}
          handleFiatToggle={handleFiatToggle}
          onSelectAsset={setSelectAssetModalOpen}
          selectTokenTestId={testIDs?.assetDropDownButton}
          testId={testIDs?.input}
        />
      </InputContainer>

      <SwapSelectAssetModal
        route3tokensSlugs={route3tokensSlugs}
        inputName={inputName}
        onAssetSelect={handleAssetSelect}
        opened={selectAssetModalOpened}
        onRequestClose={setSelectAssetModalClosed}
      />
    </div>
  );
};

export default SwapFormInput;

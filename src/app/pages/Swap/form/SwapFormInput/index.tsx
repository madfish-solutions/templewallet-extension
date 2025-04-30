import React, { FC, useCallback, useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { useToastBottomShiftModalLogic } from 'app/hooks/use-toast-bottom-shift-modal-logic';
import SwapInput from 'app/pages/Swap/form/SwapFormInput/SwapInput';
import SwapInputHeader from 'app/pages/Swap/form/SwapFormInput/SwapInputHeader';
import { InputContainer } from 'app/templates/InputContainer/InputContainer';
import { toastUniqWarning } from 'app/toaster';
import { useFormAnalytics } from 'lib/analytics';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { parseChainAssetSlug } from 'lib/assets/utils';
import { useTezosAssetBalance } from 'lib/balances';
import { useAssetFiatCurrencyPrice, useFiatCurrency } from 'lib/fiat-currency';
import { t } from 'lib/i18n';
import {
  useCategorizedTezosAssetMetadata,
  useGetCategorizedAssetMetadata,
  AssetMetadataBase,
  useTezosTokensMetadataPresenceCheck
} from 'lib/metadata';
import { useAvailableRoute3TokensSlugs } from 'lib/route3/assets';
import { useBooleanState } from 'lib/ui/hooks';
import { ZERO } from 'lib/utils/numbers';

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
  isFiatMode = false,
  setIsFiatMode = () => {}
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
    if (!assetSlug || !balance) return ZERO;

    if (!isTezosSlug) return balance;

    return balance.lte(EXCHANGE_XTZ_RESERVE) ? balance : balance.minus(EXCHANGE_XTZ_RESERVE);
  }, [assetSlug, isTezosSlug, balance]);

  const handleAmountChange = useCallback(
    (newAmount = ZERO) => {
      onChange({ assetSlug, amount: newAmount });
    },
    [assetSlug, onChange]
  );

  const handleSetMaxAmount = useCallback(() => {
    if (assetSlug && maxAmount) {
      const formattedMaxAmount = isFiatMode
        ? maxAmount.times(assetPrice).decimalPlaces(2, BigNumber.ROUND_FLOOR)
        : maxAmount;

      handleAmountChange(formattedMaxAmount);

      if (isTezosSlug && balance?.lte(EXCHANGE_XTZ_RESERVE)) {
        toastUniqWarning(t('notEnoughTezForFee'), true);
      }
    }
  }, [assetSlug, maxAmount, isFiatMode, assetPrice, handleAmountChange, isTezosSlug, balance]);

  const [selectAssetModalOpened, setSelectAssetModalOpen, setSelectAssetModalClosed] = useBooleanState(false);
  const onCloseBottomShiftCallback = useToastBottomShiftModalLogic(selectAssetModalOpened, true);

  const handleAssetSelect = useCallback(
    (chainSlug: string) => {
      const newAssetSlug = parseChainAssetSlug(chainSlug)[2];
      const newAssetMetadata = getTokenMetadata(newAssetSlug);
      if (!newAssetMetadata) return setSelectAssetModalClosed();
      const newAmount = isFiatMode ? amount : amount?.decimalPlaces(newAssetMetadata.decimals, BigNumber.ROUND_DOWN);

      onChange({
        assetSlug: newAssetSlug,
        amount: newAmount
      });
      setSelectAssetModalClosed();
      onCloseBottomShiftCallback();
      trackChange({ [inputName]: assetMetadata.symbol }, { [inputName]: newAssetMetadata.symbol });
    },
    [
      amount,
      assetMetadata.symbol,
      getTokenMetadata,
      inputName,
      onChange,
      onCloseBottomShiftCallback,
      setSelectAssetModalClosed,
      isFiatMode,
      trackChange
    ]
  );

  const handleFiatToggle = useCallback(
    (evt: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      evt.preventDefault();

      const newShouldUseFiat = !isFiatMode;
      setIsFiatMode(newShouldUseFiat);

      if (!amount) return;

      const amountBN = new BigNumber(amount);
      const formattedAmount = newShouldUseFiat
        ? amountBN.times(assetPrice).decimalPlaces(2, BigNumber.ROUND_FLOOR)
        : new BigNumber(amountBN.div(assetPrice)).decimalPlaces(assetMetadata.decimals, BigNumber.ROUND_FLOOR);

      handleAmountChange(formattedAmount);
    },
    [isFiatMode, setIsFiatMode, amount, handleAmountChange, assetPrice, assetMetadata.decimals]
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
          shouldUseFiat={isFiatMode}
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

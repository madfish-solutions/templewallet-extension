import React, { FC, useEffect, useRef, useState } from 'react';

import BigNumber from 'bignumber.js';
import { isEmpty } from 'lodash';
import { FormProvider, useForm } from 'react-hook-form';

import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as ArrowDownIcon } from 'app/icons/arrow-down.svg';
import { dispatch } from 'app/store';
import { setOnRampAssetAction } from 'app/store/settings/actions';
import { toastError } from 'app/toaster';
import { useAnalytics } from 'lib/analytics';
import { isWertSupportedChainAssetSlug } from 'lib/apis/wert';
import { toChainAssetSlug } from 'lib/assets/utils';
import {
  CROSS_CHAIN_ASSETS,
  CrossChainAsset,
  getAllowedFromAssets,
  getAllowedToAssets,
  isPairAllowed,
  toCrossChainAssetSlug
} from 'lib/cross-chain';
import { IS_DEV_ENV } from 'lib/env';
import { useAssetFiatCurrencyPrice, useFiatCurrency } from 'lib/fiat-currency';
import { T, t } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';
import { TempleChainKind } from 'temple/types';

import { CrossChainDevPanel } from './__dev__/CrossChainDevPanel';
import { CrossChainAnalyticsEvents } from './analytics';
import { GetCard } from './components/GetCard';
import { SendCard } from './components/SendCard';
import { SummaryRow } from './components/SummaryRow';
import { CrossChainFormData } from './form-data';
import { useCrossChainFromBalance } from './hooks/use-cross-chain-balance';
import { useCrossChainExolixNetworksMap } from './hooks/use-cross-chain-exolix-networks-map';
import { useCrossChainRate } from './hooks/use-cross-chain-rate';
import { SelectCrossChainToAssetModal } from './modals/SelectCrossChainAsset';
import { SelectCrossChainFromAssetModal } from './modals/SelectCrossChainFromAsset';

const SERVICE_FEE_PERCENT = 0.5;

type SelectKind = 'from' | 'to';

interface Props {
  onReview: (data: {
    fromAsset: CrossChainAsset;
    toAsset: CrossChainAsset;
    fromAmount: string;
    toAmountEstimated: string;
    recipient: string;
  }) => void;
  resetSignal?: number;
}

export const CrossChainForm: FC<Props> = ({ onReview, resetSignal }) => {
  const [fromAsset, setFromAsset] = useState<CrossChainAsset>(CROSS_CHAIN_ASSETS.TEZOS_USDT);
  const [toAsset, setToAsset] = useState<CrossChainAsset>(CROSS_CHAIN_ASSETS.ETH_USDT);

  const [selectOpened, setSelectOpened, setSelectClosed] = useBooleanState(false);
  const [selectKind, setSelectKind] = useState<SelectKind>('from');
  const [isFiatMode, setIsFiatMode] = useState(false);

  const { map: networksMap, isReady: networksMapReady } = useCrossChainExolixNetworksMap();

  useEffect(() => {
    if (!networksMapReady) return;
    const resolveFresh = (asset: CrossChainAsset, candidates: CrossChainAsset[]) =>
      candidates.find(c => toCrossChainAssetSlug(c) === toCrossChainAssetSlug(asset));

    const refreshedFrom = resolveFresh(fromAsset, getAllowedFromAssets(networksMap));
    if (refreshedFrom && refreshedFrom.exolixNetwork !== fromAsset.exolixNetwork) setFromAsset(refreshedFrom);

    const refreshedTo = resolveFresh(toAsset, getAllowedToAssets(fromAsset, networksMap));
    if (refreshedTo && refreshedTo.exolixNetwork !== toAsset.exolixNetwork) setToAsset(refreshedTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [networksMap, networksMapReady]);

  const form = useForm<CrossChainFormData>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: { fromAmount: '', to: '' }
  });

  const { watch, handleSubmit, setValue, setError, clearErrors, formState, reset } = form;

  useEffect(() => {
    if (resetSignal === undefined) return;
    reset({ fromAmount: '', to: '' });
    setIsFiatMode(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);
  const { submitCount, errors } = formState;
  const formSubmitted = submitCount > 0;

  const fromAmount = watch('fromAmount');

  const balance = useCrossChainFromBalance(fromAsset);

  const { selectedFiatCurrency } = useFiatCurrency();
  const inputAssetPrice = useAssetFiatCurrencyPrice(
    fromAsset.assetSlug ?? '',
    fromAsset.chainId ?? '',
    fromAsset.chainKind === TempleChainKind.EVM
  );
  const hasFiatPrice = inputAssetPrice.isGreaterThan(0);

  const fromAmountInTokens = (() => {
    if (!fromAmount) return '';
    if (isFiatMode && hasFiatPrice) {
      return new BigNumber(fromAmount)
        .div(inputAssetPrice)
        .decimalPlaces(fromAsset.decimals, BigNumber.ROUND_FLOOR)
        .toFixed();
    }
    return fromAmount;
  })();

  const { normalized: rate, isValidating: rateLoading } = useCrossChainRate({
    from: fromAsset,
    to: toAsset,
    amount: fromAmountInTokens
  });

  const rateMinAmount = rate?.kind === 'ok' || rate?.kind === 'min-bound' ? rate.minAmount : undefined;
  const rateMaxAmount = rate?.kind === 'ok' || rate?.kind === 'max-bound' ? rate.maxAmount : undefined;

  const lastUnsupportedPairRef = useRef<string | null>(null);
  useEffect(() => {
    const isUnsupportedPair = rate?.kind === 'unsupported';
    const pairKey = `${fromAsset.exolixCoin}:${fromAsset.exolixNetwork}->${toAsset.exolixCoin}:${toAsset.exolixNetwork}`;

    if (!isUnsupportedPair) {
      if (lastUnsupportedPairRef.current === pairKey) lastUnsupportedPairRef.current = null;
      return;
    }

    const hasMeaningfulAmount = fromAmountInTokens && new BigNumber(fromAmountInTokens).isGreaterThan(0);
    if (!hasMeaningfulAmount) return;

    if (lastUnsupportedPairRef.current === pairKey) return;
    lastUnsupportedPairRef.current = pairKey;
    toastError(t('pairNotAvailable'));
  }, [
    rate,
    fromAsset.exolixCoin,
    fromAsset.exolixNetwork,
    toAsset.exolixCoin,
    toAsset.exolixNetwork,
    fromAmountInTokens
  ]);

  const insufficientBalance = (() => {
    if (!fromAmountInTokens) return false;
    const n = new BigNumber(fromAmountInTokens);
    return n.isGreaterThan(0) && n.isGreaterThan(balance);
  })();

  const amountError = (() => {
    if (!fromAmountInTokens) return t('required');
    const n = new BigNumber(fromAmountInTokens);
    if (n.isNaN() || n.isLessThanOrEqualTo(0)) return t('invalidAmount');
    if (insufficientBalance) return t('insufficientBalance');
    if (!rate) return undefined;
    switch (rate.kind) {
      case 'unsupported':
        return t('pairNotAvailable');
      case 'min-bound':
        return t('minWithSymbol', [String(rate.minAmount), fromAsset.symbol]);
      case 'max-bound':
        return t('maxWithSymbol', [String(rate.maxAmount), fromAsset.symbol]);
      case 'unknown':
        return t('unableToFetchRate');
      case 'ok':
        return undefined;
    }
  })();

  const toAmountEstimated = (() => {
    if (!fromAmountInTokens) return '';
    if (rate?.kind !== 'ok') return '';
    return String(rate.toAmount ?? '');
  })();

  const openSelect = (kind: SelectKind) => {
    setSelectKind(kind);
    setSelectOpened();
  };

  const { trackEvent } = useAnalytics();

  const handleAssetSelect = (asset: CrossChainAsset) => {
    trackEvent(CrossChainAnalyticsEvents.CrossChainAssetSelected, undefined, {
      kind: selectKind,
      coin: asset.exolixCoin,
      network: asset.exolixNetwork
    });
    if (selectKind === 'from') {
      setFromAsset(asset);
      setIsFiatMode(false);
      setValue('fromAmount', '');
      if (!isPairAllowed(asset, toAsset, networksMap)) {
        const [firstAllowed] = getAllowedToAssets(asset, networksMap);
        if (firstAllowed) {
          setToAsset(firstAllowed);
          if (firstAllowed.chainId !== toAsset.chainId || firstAllowed.dest !== toAsset.dest) {
            setValue('to', '');
            clearErrors('to');
          }
        }
      }
    } else {
      if (asset.chainId !== toAsset.chainId || asset.dest !== toAsset.dest) {
        setValue('to', '');
        clearErrors('to');
      }
      setToAsset(asset);
    }
  };

  const handleSetMax = () => {
    if (balance.isLessThanOrEqualTo(0)) return;
    const maxValue =
      isFiatMode && hasFiatPrice
        ? balance.times(inputAssetPrice).decimalPlaces(2, BigNumber.ROUND_FLOOR).toFixed()
        : balance.toFixed();
    setValue('fromAmount', maxValue, { shouldValidate: submitCount > 0 });
  };

  const handleFiatToggle = (evt: React.MouseEvent<HTMLButtonElement>) => {
    evt.preventDefault();
    if (!hasFiatPrice) return;
    const newFiatMode = !isFiatMode;
    setIsFiatMode(newFiatMode);
    if (!fromAmount) return;
    const amountBN = new BigNumber(fromAmount);
    if (amountBN.isNaN()) return;
    const converted = newFiatMode
      ? amountBN.times(inputAssetPrice).decimalPlaces(2, BigNumber.ROUND_FLOOR)
      : amountBN.div(inputAssetPrice).decimalPlaces(fromAsset.decimals, BigNumber.ROUND_FLOOR);
    setValue('fromAmount', converted.toFixed(), { shouldValidate: submitCount > 0 });
  };

  const fiatToggleLabel = isFiatMode ? fromAsset.symbol : selectedFiatCurrency.name;

  useEffect(() => {
    if (!formSubmitted) return;
    if (amountError) setError('fromAmount', { message: amountError });
    else clearErrors('fromAmount');
  }, [amountError, clearErrors, formSubmitted, setError]);

  const onSubmit = (data: CrossChainFormData) => {
    if (amountError) {
      setError('fromAmount', { message: amountError });
      if (insufficientBalance && fromAsset.chainKind && fromAsset.chainId != null && fromAsset.assetSlug) {
        const chainAssetSlug = toChainAssetSlug(fromAsset.chainKind, String(fromAsset.chainId), fromAsset.assetSlug);
        if (isWertSupportedChainAssetSlug(chainAssetSlug)) {
          dispatch(setOnRampAssetAction({ chainAssetSlug }));
        }
      }
      return;
    }
    if (!toAmountEstimated) {
      setError('fromAmount', { message: t('unableToFetchRate') });
      return;
    }
    onReview({
      fromAsset,
      toAsset,
      fromAmount: fromAmountInTokens || data.fromAmount,
      toAmountEstimated,
      recipient: data.to.trim()
    });
  };

  return (
    <FormProvider {...form}>
      <div className="flex-1 px-4 flex flex-col overflow-y-auto">
        <form id="cross-chain-form" onSubmit={handleSubmit(onSubmit)}>
          <SendCard
            asset={fromAsset}
            amount={fromAmount}
            balance={balance}
            insufficient={insufficientBalance}
            min={rateMinAmount}
            max={rateMaxAmount}
            errorMessage={formSubmitted ? errors.fromAmount?.message : undefined}
            isFiatMode={isFiatMode}
            fiatToggleLabel={hasFiatPrice ? t('switchToCurrency', fiatToggleLabel) : undefined}
            floatingAssetSymbol={isFiatMode ? selectedFiatCurrency.name : undefined}
            onAmountChange={v => setValue('fromAmount', v, { shouldValidate: submitCount > 0 })}
            onAssetClick={() => openSelect('from')}
            onMaxClick={handleSetMax}
            onFiatToggle={hasFiatPrice ? handleFiatToggle : undefined}
          />

          <div className="w-full -my-2.5 flex justify-center z-1 relative pointer-events-none">
            <div className="flex items-center justify-center w-8 h-8 bg-grey-4 rounded-6">
              <ArrowDownIcon width={11} height={13} />
            </div>
          </div>

          <GetCard
            asset={toAsset}
            amount={toAmountEstimated}
            loading={rateLoading}
            onAssetClick={() => openSelect('to')}
          />

          <SummaryRow feePercent={SERVICE_FEE_PERCENT} />
        </form>

        {IS_DEV_ENV && <CrossChainDevPanel />}
      </div>

      <ActionsButtonsBox shouldCastShadow>
        <StyledButton
          type="submit"
          form="cross-chain-form"
          size="L"
          color="primary"
          loading={rateLoading}
          disabled={formSubmitted && !isEmpty(errors)}
        >
          <T id="review" />
        </StyledButton>
      </ActionsButtonsBox>

      <SelectCrossChainFromAssetModal
        opened={selectOpened && selectKind === 'from'}
        networksMap={networksMap}
        onSelect={handleAssetSelect}
        onRequestClose={setSelectClosed}
      />

      <SelectCrossChainToAssetModal
        opened={selectOpened && selectKind === 'to'}
        currentFromAsset={fromAsset}
        networksMap={networksMap}
        onSelect={handleAssetSelect}
        onRequestClose={setSelectClosed}
      />
    </FormProvider>
  );
};

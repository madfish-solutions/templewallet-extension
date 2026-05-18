import { FC, useCallback, useEffect, useImperativeHandle } from 'react';

import { ChainIds } from '@taquito/taquito';
import BigNumber from 'bignumber.js';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import { DeadEndBoundaryError } from 'app/ErrorBoundary';
import { usePendingTezosTransactionsHashes } from 'app/store/tezos/pending-transactions/utils';
import { toastError } from 'app/toaster';
import { useFormAnalytics } from 'lib/analytics';
import { fromAssetSlug, isTezAsset } from 'lib/assets';
import { useTezosAssetBalance } from 'lib/balances';
import { useAssetFiatCurrencyPrice } from 'lib/fiat-currency';
import { toLocalFixed, t } from 'lib/i18n';
import { useCategorizedTezosAssetMetadata, getAssetSymbol, isCollectible } from 'lib/metadata';
import { validateRecipient as validateAddress } from 'lib/temple/front';
import { isValidTezosAddress, isTezosContractAddress } from 'lib/tezos';
import { useSafeState } from 'lib/ui/hooks';
import { ZERO } from 'lib/utils/numbers';
import { getAccountAddressForTezos } from 'temple/accounts';
import { useAccountForTezos, useTezosChainByChainId, useVisibleAccounts } from 'temple/front';
import { useSettings } from 'temple/front/ready';
import { isTezosDomainsNameValid, getTezosDomainsClient, useTezosAddressByDomainName } from 'temple/front/tezos';

import { useSendFormControl } from '../context';
import { useTezosMaxAmount } from '../hooks/use-max-amount';

import { BaseForm } from './BaseForm';
import { ReviewData, SendFormData } from './interfaces';
import { getMaxAmountFiat } from './utils';

interface Props {
  chainId: string;
  assetSlug: string;
  onSelectAssetClick: EmptyFn;
  onReview: SyncFn<ReviewData>;
}

export const TezosForm: FC<Props> = ({ chainId, assetSlug, onSelectAssetClick, onReview }) => {
  const account = useAccountForTezos();
  const network = useTezosChainByChainId(chainId);

  const formControlRef = useSendFormControl();

  if (!account || !network) throw new DeadEndBoundaryError();

  const assetMetadata = useCategorizedTezosAssetMetadata(assetSlug, chainId);

  if (!assetMetadata) throw new Error('Metadata not found');

  const allAccounts = useVisibleAccounts();
  const { contacts } = useSettings();

  const assetPrice = useAssetFiatCurrencyPrice(assetSlug, chainId);

  const isNft = isCollectible(assetMetadata);
  const assetDecimals = assetMetadata.decimals ?? 0;

  const assetSymbol = getAssetSymbol(assetMetadata);

  const accountPkh = account.address;
  const domainsClient = getTezosDomainsClient(network);

  const formAnalytics = useFormAnalytics('SendForm');

  const { value: balance = ZERO } = useTezosAssetBalance(assetSlug, accountPkh, network);

  const [shouldUseFiat, setShouldUseFiat] = useSafeState(false);

  const canToggleFiat = network.chainId === ChainIds.MAINNET && assetPrice.isGreaterThan(ZERO);

  const form = useForm<SendFormData>({
    mode: 'onSubmit',
    reValidateMode: 'onChange'
  });

  const { control, formState, trigger, reset } = form;

  const toValue = useWatch({ name: 'to', control });

  const toFilledWithAddress = Boolean(toValue && isValidTezosAddress(toValue));
  const toFilledWithDomain = Boolean(toValue && isTezosDomainsNameValid(toValue, domainsClient));

  const { data: resolvedAddress } = useTezosAddressByDomainName(toValue, network);

  const toFilled = resolvedAddress ? toFilledWithDomain : toFilledWithAddress;

  const toResolved = resolvedAddress || toValue;

  const isToFilledWithFamiliarAddress =
    toFilled &&
    (allAccounts.some(acc => getAccountAddressForTezos(acc) === toResolved) ||
      Boolean(contacts?.some(contact => contact.address === toResolved)));

  const { max: maxAmountAsset, estimating: maxEstimating } = useTezosMaxAmount({
    account,
    network,
    assetSlug,
    balance,
    to: toFilled ? toResolved : undefined
  });

  const maxAmount = shouldUseFiat ? getMaxAmountFiat(assetPrice.toNumber(), maxAmountAsset) : maxAmountAsset;

  const validateAmount = useCallback(
    (amount: string) => {
      if (!amount) return t('required');
      if (toValue && !isTezosContractAddress(toValue) && Number(amount) === 0) return t('amountMustBePositive');

      return (
        new BigNumber(amount).isLessThanOrEqualTo(maxAmount) ||
        t('maximalAmount', toLocalFixed(maxAmount, Math.min(assetDecimals, 6)))
      );
    },
    [maxAmount, toValue, assetDecimals]
  );

  const validateRecipient = useCallback(
    (address: string) => {
      if (!address) return t('required');

      return validateAddress(address, domainsClient);
    },
    [domainsClient]
  );

  const maxAmountStr = maxAmount?.toString();
  useEffect(() => {
    if (formState.dirtyFields.amount) {
      trigger('amount');
    }
  }, [formState.dirtyFields, trigger, maxAmountStr]);

  const toAssetAmount = useCallback(
    (fiatAmount: BigNumber.Value) =>
      new BigNumber(fiatAmount).dividedBy(assetPrice ?? 1).toFormat(assetDecimals, BigNumber.ROUND_FLOOR, {
        decimalSeparator: '.'
      }),
    [assetPrice, assetDecimals]
  );

  const resetForm = useCallback(() => {
    reset({ to: '', amount: '' });
    setShouldUseFiat(false);
  }, [reset, setShouldUseFiat]);

  useImperativeHandle(formControlRef, () => ({ resetForm }));

  const pendingTxHashes = usePendingTezosTransactionsHashes(accountPkh, chainId);
  const otherOperationsPending = pendingTxHashes.length > 0;

  const onSubmit = useCallback(
    async ({ amount }: SendFormData) => {
      if (formState.isSubmitting) return;

      if (otherOperationsPending) {
        toastError(t('otherOperationsPendingError'));

        return;
      }

      const actualAmount = shouldUseFiat ? toAssetAmount(amount) : amount;

      const contract = isTezAsset(assetSlug)
        ? 'gas'
        : (() => {
            const [contractAddress] = fromAssetSlug(assetSlug);
            return contractAddress;
          })();

      const analyticsPayload = {
        network: network.name,
        inputAsset: assetSymbol,
        inputAmount: String(actualAmount),
        contract
      };

      formAnalytics.trackSubmit(analyticsPayload);

      try {
        onReview({
          account,
          assetSlug,
          network,
          amount: actualAmount,
          to: toResolved,
          onConfirm: resetForm
        });

        formAnalytics.trackSubmitSuccess(analyticsPayload);
      } catch (err: any) {
        console.error(err);

        formAnalytics.trackSubmitFail(analyticsPayload);

        toastError('Oops, Something went wrong!');
      }
    },
    [
      account,
      assetSlug,
      assetSymbol,
      formAnalytics,
      formState.isSubmitting,
      network,
      onReview,
      resetForm,
      shouldUseFiat,
      toAssetAmount,
      toResolved,
      otherOperationsPending
    ]
  );

  return (
    <FormProvider {...form}>
      <BaseForm
        network={network}
        accountPkh={accountPkh}
        assetSlug={assetSlug}
        assetSymbol={assetSymbol}
        assetPrice={assetPrice}
        isCollectible={isNft}
        maxAmount={maxAmount}
        maxEstimating={maxEstimating}
        canToggleFiat={canToggleFiat}
        shouldUseFiat={shouldUseFiat}
        setShouldUseFiat={setShouldUseFiat}
        assetDecimals={assetDecimals}
        validateAmount={validateAmount}
        validateRecipient={validateRecipient}
        onSelectAssetClick={onSelectAssetClick}
        isToFilledWithFamiliarAddress={isToFilledWithFamiliarAddress}
        shouldShowConvertedAmountBlock={!isCollectible(assetMetadata)}
        onSubmit={onSubmit}
      />
    </FormProvider>
  );
};

import { useCallback, useEffect, useMemo, useState } from 'react';

import { ForgeParams } from '@taquito/local-forging';
import { Estimate, TezosOperationError, TezosToolkit, WalletParamsWithKind, getRevealFee } from '@taquito/taquito';
import BigNumber from 'bignumber.js';
import { useForm, useWatch } from 'react-hook-form';
import { BehaviorSubject, EMPTY, catchError, from, map, of, switchMap } from 'rxjs';
import { useDebounce } from 'use-debounce';

import {
  DEFAULT_FEE_OPTION,
  DisplayedFeeOptions,
  FeeOptionLabel,
  TezosEstimationData,
  useTezosEstimationDataState
} from 'lib/temple/front/estimation-data-providers';
import { mutezToTz } from 'lib/temple/helpers';
import { SerializedEstimate, StoredAccount } from 'lib/temple/types';
import { getBalancesChanges } from 'lib/tezos';
import { useSafeState } from 'lib/ui/hooks';
import { ZERO } from 'lib/utils/numbers';
import { serializeEstimate } from 'lib/utils/serialize-estimate';
import { AccountForChain, getAccountAddressForTezos } from 'temple/accounts';
import { getTezosToolkitWithSigner, takeOperationStartingBlockLevel } from 'temple/front';
import { TezosNetworkEssentials } from 'temple/networks';
import { AssetsAmounts, TempleChainKind } from 'temple/types';

import { DEFAULT_INPUT_DEBOUNCE } from './constants';
import {
  forgeTezosOperation,
  getTezosFinalOpParams,
  getTotalStorageLimit,
  simulateTezosBalancesChanges
} from './tezos-operation';
import { Tab, TezosTxParamsFormData } from './types';
import { getTezosFeeOption } from './utils';

const SEND_TEZ_TO_NON_EMPTY_ESTIMATE = new Estimate(169000, 0, 155, 250, 100);

interface TezosEstimationFormHookParams {
  estimationData: TezosEstimationData | undefined;
  basicParams: WalletParamsWithKind[] | undefined;
  senderAccount: StoredAccount | AccountForChain<TempleChainKind.Tezos>;
  network: TezosNetworkEssentials;
  simulateOperation?: boolean;
  sourcePkIsRevealed?: boolean;
  estimationDataLoading?: boolean;
}

export const useTezosEstimationForm = ({
  estimationData,
  basicParams,
  senderAccount,
  network,
  simulateOperation,
  sourcePkIsRevealed = true,
  estimationDataLoading = false
}: TezosEstimationFormHookParams) => {
  const ownerAddress =
    'ownerAddress' in senderAccount
      ? senderAccount.ownerAddress
      : 'owner' in senderAccount
        ? senderAccount.owner
        : undefined;
  const accountPkh = useMemo(
    () => ('address' in senderAccount ? senderAccount.address : getAccountAddressForTezos(senderAccount)!),
    [senderAccount]
  );
  const sender = ownerAddress || accountPkh;
  const tezos = getTezosToolkitWithSigner(network, sender, true);
  const estimates = estimationData?.estimates;
  const params$ = useMemo(() => new BehaviorSubject<ForgeParams | null>(null), []);
  const [balancesChanges, setBalancesChanges] = useSafeState<AssetsAmounts>({});
  const [balancesChangesLoading, setBalancesChangesLoading] = useSafeState(false);
  const [simulationError, setSimulationError] = useSafeState<unknown>(null);

  const revealFee = useMemo(
    () => estimationData?.revealFee ?? (sourcePkIsRevealed ? ZERO : mutezToTz(getRevealFee(sender))),
    [estimationData?.revealFee, sender, sourcePkIsRevealed]
  );

  useEffect(() => {
    const deltas$ = params$.pipe(
      switchMap(operation => {
        if (!operation) {
          return EMPTY;
        }

        return from(simulateTezosBalancesChanges(tezos.rpc, network.chainId, operation, accountPkh)).pipe(
          map(balancesChanges => {
            setSimulationError(null);
            setBalancesChangesLoading(false);

            return balancesChanges;
          }),
          catchError(e => {
            setSimulationError(e);

            try {
              return of(getBalancesChanges(operation.contents, accountPkh));
            } catch (err) {
              console.error(err);

              return EMPTY;
            } finally {
              setBalancesChangesLoading(false);
            }
          })
        );
      })
    );

    const sub = deltas$.subscribe(deltas => {
      setBalancesChanges(deltas);
    });

    return () => sub.unsubscribe();
  }, [
    accountPkh,
    params$,
    tezos.rpc,
    network.chainId,
    setBalancesChangesLoading,
    setBalancesChanges,
    setSimulationError
  ]);

  const defaultValues = useMemo(() => {
    let gasFee: BigNumber | undefined;
    let storageLimit: BigNumber | undefined;

    if (basicParams) {
      gasFee = revealFee;
      storageLimit = ZERO;
      for (let i = 0; i < basicParams.length; i++) {
        if (gasFee === undefined && storageLimit === undefined) break;

        const suboperationParams = basicParams[i];
        const { fee: suboperationGasFeeMutez, storageLimit: suboperationStorageLimit } = suboperationParams;
        gasFee = suboperationGasFeeMutez === undefined ? undefined : gasFee?.plus(mutezToTz(suboperationGasFeeMutez));
        storageLimit =
          suboperationStorageLimit === undefined ? undefined : storageLimit?.plus(suboperationStorageLimit);
      }
    }

    return { gasFee: gasFee?.toString() ?? '', storageLimit: storageLimit?.toString() ?? '' };
  }, [basicParams, revealFee]);
  const form = useForm<TezosTxParamsFormData>({ mode: 'onChange', defaultValues });
  const { setValue, control } = form;

  const gasFeeValue = useWatch({ name: 'gasFee', control });
  const storageLimitValue = useWatch({ name: 'storageLimit', control });

  const [debouncedGasFee] = useDebounce(gasFeeValue, DEFAULT_INPUT_DEBOUNCE);
  const [debouncedStorageLimit] = useDebounce(storageLimitValue, DEFAULT_INPUT_DEBOUNCE);

  const [tab, setTab] = useState<Tab>('details');
  const [selectedFeeOption, setSelectedFeeOption] = useState<FeeOptionLabel | null>(
    defaultValues.gasFee ? null : DEFAULT_FEE_OPTION
  );

  const { setData } = useTezosEstimationDataState();

  useEffect(() => {
    if (estimationData) setData(estimationData);
  }, [estimationData, setData]);

  const gasFeeFromEstimation = estimationData?.gasFee;
  const displayedFeeOptions = useMemo<DisplayedFeeOptions | undefined>(() => {
    const gasFee =
      gasFeeFromEstimation ??
      (basicParams && !estimationDataLoading
        ? mutezToTz(SEND_TEZ_TO_NON_EMPTY_ESTIMATE.suggestedFeeMutez * basicParams.length).plus(revealFee)
        : undefined);

    if (!(gasFee instanceof BigNumber)) return;

    return {
      slow: getTezosFeeOption('slow', gasFee),
      mid: getTezosFeeOption('mid', gasFee),
      fast: getTezosFeeOption('fast', gasFee)
    };
  }, [basicParams, gasFeeFromEstimation, revealFee, estimationDataLoading]);

  const displayedFee = useMemo(() => {
    if (debouncedGasFee) return debouncedGasFee;

    // Typed value has not settled yet. Don't show a different fee than submit will use.
    if (gasFeeValue || !displayedFeeOptions) return;

    return displayedFeeOptions[selectedFeeOption ?? DEFAULT_FEE_OPTION];
  }, [debouncedGasFee, displayedFeeOptions, gasFeeValue, selectedFeeOption]);

  const totalDefaultStorageLimit = useMemo(() => getTotalStorageLimit(estimates), [estimates]);
  const displayedStorageFee = useMemo(() => {
    if (!basicParams) return;

    const estimatesWithFallback =
      estimates ??
      Array<SerializedEstimate>(basicParams.length).fill(serializeEstimate(SEND_TEZ_TO_NON_EMPTY_ESTIMATE));

    const storageLimit = debouncedStorageLimit || totalDefaultStorageLimit.toString();
    const minimalFeePerStorageByteMutez = estimatesWithFallback[0].minimalFeePerStorageByteMutez;

    return mutezToTz(new BigNumber(storageLimit).times(minimalFeePerStorageByteMutez)).toString();
  }, [basicParams, estimates, debouncedStorageLimit, totalDefaultStorageLimit]);

  useEffect(() => {
    if (gasFeeValue && selectedFeeOption) setSelectedFeeOption(null);
  }, [gasFeeValue, selectedFeeOption]);

  const makeFinalOpParams = useCallback(
    (gasFee: string, storageLimit: string, revealFee: BigNumber, displayedFeeOptions?: DisplayedFeeOptions) => {
      if (!displayedFeeOptions || !basicParams) return;

      return getTezosFinalOpParams({
        basicParams,
        estimates: estimationDataLoading ? undefined : estimates,
        revealFee,
        totalFeeTz: gasFee || displayedFeeOptions[selectedFeeOption || DEFAULT_FEE_OPTION],
        storageLimit,
        totalDefaultStorageLimit
      });
    },
    [basicParams, estimates, estimationDataLoading, selectedFeeOption, totalDefaultStorageLimit]
  );

  const submitOperation = useCallback(
    async (
      tezos: TezosToolkit,
      gasFee: string,
      storageLimit: string,
      revealFee: BigNumber,
      displayedFeeOptions?: DisplayedFeeOptions
    ) => {
      const opParams = makeFinalOpParams(gasFee, storageLimit, revealFee, displayedFeeOptions);

      if (!opParams) return;

      const operation = await tezos.wallet.batch(opParams).send();

      return {
        operation,
        startingBlockLevel: takeOperationStartingBlockLevel(operation.opHash)
      };
    },
    [makeFinalOpParams]
  );

  const setRawTransaction = useCallback(async () => {
    try {
      if (simulateOperation) {
        setBalancesChangesLoading(true);
      }
      const sourcePublicKey = await tezos.wallet.pk();

      const opParams = makeFinalOpParams(debouncedGasFee, debouncedStorageLimit, revealFee, displayedFeeOptions);
      const forged = opParams ? await forgeTezosOperation(network, accountPkh, sourcePublicKey, opParams) : undefined;

      if (forged?.bytesToSign) {
        if (simulateOperation) {
          params$.next(forged.forgeParams);
        }
        setValue('raw', forged.forgeParams);
        setValue('bytes', forged.bytesToSign);
      } else if (simulateOperation) {
        setBalancesChangesLoading(false);
      }
    } catch (err: unknown) {
      console.error(err);
      if (simulateOperation) setSimulationError(err);
      setBalancesChangesLoading(false);
    }
  }, [
    accountPkh,
    displayedFeeOptions,
    debouncedGasFee,
    network,
    setValue,
    debouncedStorageLimit,
    makeFinalOpParams,
    tezos,
    revealFee,
    simulateOperation,
    params$,
    setSimulationError,
    setBalancesChangesLoading
  ]);

  useEffect(() => void setRawTransaction(), [setRawTransaction]);

  const handleFeeOptionSelect = useCallback(
    (label: FeeOptionLabel) => {
      setSelectedFeeOption(label);
      setValue('gasFee', '', { shouldValidate: true });
    },
    [setValue]
  );

  const getFeeParams = useCallback(
    (customGasFee: string, customStorageLimit: string) => {
      const parsedCustomGasFee = new BigNumber(customGasFee);
      const parsedCustomStorageLimit = new BigNumber(customStorageLimit);
      const currentGasFeePreset = displayedFeeOptions?.[selectedFeeOption || DEFAULT_FEE_OPTION];

      return {
        gasFee: parsedCustomGasFee.isPositive()
          ? parsedCustomGasFee
          : currentGasFeePreset
            ? new BigNumber(currentGasFeePreset)
            : null,
        storageLimit: parsedCustomStorageLimit.gte(0) ? parsedCustomStorageLimit : totalDefaultStorageLimit
      };
    },
    [totalDefaultStorageLimit, displayedFeeOptions, selectedFeeOption]
  );

  const assertCustomGasFeeNotTooLow = useCallback(
    (value: BigNumber.Value | nullish) => {
      if (value == null || !displayedFeeOptions) return;

      if (new BigNumber(value).div(displayedFeeOptions.slow).lt('0.8')) {
        throw new TezosOperationError(
          [{ kind: 'permanent', id: 'proto.023-PtSeouLo.prefilter.fees_too_low' }],
          'Fees are too low',
          []
        );
      }
    },
    [displayedFeeOptions]
  );

  return {
    balancesChanges,
    balancesChangesLoading,
    simulationError,
    form,
    tab,
    setTab,
    selectedFeeOption,
    getFeeParams,
    handleFeeOptionSelect,
    submitOperation,
    displayedFeeOptions,
    displayedFee,
    displayedStorageFee,
    assertCustomGasFeeNotTooLow
  };
};

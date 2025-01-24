import { useCallback, useEffect, useMemo, useState } from 'react';

import { ForgeParams, localForger } from '@taquito/local-forging';
import { TezosToolkit, WalletParamsWithKind, getRevealFee } from '@taquito/taquito';
import BigNumber from 'bignumber.js';
import { useForm } from 'react-hook-form-v7';
import { BehaviorSubject, EMPTY, catchError, from, of, switchMap } from 'rxjs';
import { useDebounce } from 'use-debounce';

import { buildFinalTezosOpParams, mutezToTz, tzToMutez } from 'lib/temple/helpers';
import { ReadOnlySigner } from 'lib/temple/read-only-signer';
import { StoredAccount } from 'lib/temple/types';
import { getBalancesChanges } from 'lib/tezos';
import { useSafeState } from 'lib/ui/hooks';
import { ZERO } from 'lib/utils/numbers';
import { AccountForChain, getAccountAddressForTezos } from 'temple/accounts';
import { getTezosToolkitWithSigner } from 'temple/front';
import { getTezosFastRpcClient, michelEncoder } from 'temple/tezos';
import { BalancesChanges, TempleChainKind } from 'temple/types';

import { DEFAULT_INPUT_DEBOUNCE } from './constants';
import { useTezosEstimationDataState } from './context';
import { DisplayedFeeOptions, FeeOptionLabel, Tab, TezosEstimationData, TezosTxParamsFormData } from './types';
import { getTezosFeeOption } from './utils';

export const useTezosEstimationForm = (
  estimationData: TezosEstimationData | undefined,
  basicParams: WalletParamsWithKind[] | undefined,
  senderAccount: StoredAccount | AccountForChain<TempleChainKind.Tezos>,
  rpcBaseURL: string,
  chainId: string,
  simulateOperation?: boolean
) => {
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
  const tezos = getTezosToolkitWithSigner(rpcBaseURL, sender, true);
  const estimates = estimationData?.estimates;
  const params$ = useMemo(() => new BehaviorSubject<ForgeParams | null>(null), []);
  const [balancesChanges, setBalancesChanges] = useSafeState<BalancesChanges>({});
  const [balancesChangesLoading, setBalancesChangesLoading] = useSafeState(false);

  useEffect(() => {
    const deltas$ = params$.pipe(
      switchMap(operation => {
        if (!operation) {
          return EMPTY;
        }

        return from(tezos.rpc.simulateOperation({ operation, chain_id: chainId })).pipe(
          catchError(e => {
            console.error(e);

            return from(
              tezos.rpc.simulateOperation({ operation: { contents: operation.contents }, chain_id: chainId })
            );
          }),
          switchMap(response => {
            if (
              response.contents.some(
                entry =>
                  'metadata' in entry &&
                  'operation_result' in entry.metadata &&
                  entry.metadata.operation_result.status !== 'applied'
              )
            ) {
              throw new Error('Could not get results by simulation');
            }

            setBalancesChangesLoading(false);

            return of(getBalancesChanges(response.contents, accountPkh));
          }),
          catchError(e => {
            console.error(e);

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
  }, [accountPkh, params$, tezos.rpc, chainId, setBalancesChangesLoading, setBalancesChanges]);

  const defaultValues = useMemo(() => {
    let gasFee: BigNumber | undefined;
    let storageLimit: BigNumber | undefined;

    if (basicParams) {
      gasFee = estimates && estimates.length > basicParams.length ? mutezToTz(getRevealFee(sender)) : ZERO;
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
  }, [basicParams, estimates, sender]);
  const form = useForm<TezosTxParamsFormData>({ mode: 'onChange', defaultValues });
  const { watch, setValue } = form;

  const gasFeeValue = watch('gasFee');

  const [debouncedGasFee] = useDebounce(gasFeeValue, DEFAULT_INPUT_DEBOUNCE);
  const [debouncedStorageLimit] = useDebounce(watch('storageLimit'), DEFAULT_INPUT_DEBOUNCE);

  const [tab, setTab] = useState<Tab>('details');
  const [selectedFeeOption, setSelectedFeeOption] = useState<FeeOptionLabel | null>(
    defaultValues.gasFee ? null : 'mid'
  );

  const { setData } = useTezosEstimationDataState();

  useEffect(() => {
    if (estimationData) setData(estimationData);
  }, [estimationData, setData]);

  const displayedFeeOptions = useMemo<DisplayedFeeOptions | undefined>(() => {
    const gasFee = estimationData?.gasFee;

    if (!(gasFee instanceof BigNumber)) return;

    return {
      slow: getTezosFeeOption('slow', gasFee),
      mid: getTezosFeeOption('mid', gasFee),
      fast: getTezosFeeOption('fast', gasFee)
    };
  }, [estimationData]);

  const displayedFee = useMemo(() => {
    if (debouncedGasFee) return debouncedGasFee;

    if (displayedFeeOptions && selectedFeeOption) return displayedFeeOptions[selectedFeeOption];

    return;
  }, [selectedFeeOption, debouncedGasFee, displayedFeeOptions]);

  const totalDefaultStorageLimit = useMemo(
    () => (estimates ?? []).reduce((acc, { storageLimit }) => acc.plus(storageLimit), new BigNumber(0)),
    [estimates]
  );
  const displayedStorageFee = useMemo(() => {
    if (!estimates) return;

    const storageLimit = debouncedStorageLimit || totalDefaultStorageLimit.toString();
    const minimalFeePerStorageByteMutez = estimates[0].minimalFeePerStorageByteMutez;

    return mutezToTz(new BigNumber(storageLimit).times(minimalFeePerStorageByteMutez)).toString();
  }, [estimates, debouncedStorageLimit, totalDefaultStorageLimit]);

  useEffect(() => {
    if (gasFeeValue && selectedFeeOption) setSelectedFeeOption(null);
  }, [gasFeeValue, selectedFeeOption]);

  const submitOperation = useCallback(
    async (
      tezos: TezosToolkit,
      gasFee: string,
      storageLimit: string,
      revealFee: BigNumber,
      displayedFeeOptions?: DisplayedFeeOptions
    ) => {
      if (!displayedFeeOptions || !basicParams) return;

      const opParams = buildFinalTezosOpParams(
        basicParams,
        tzToMutez(gasFee || displayedFeeOptions[selectedFeeOption || 'mid'])
          .minus(revealFee)
          .toNumber(),
        storageLimit ? Number(storageLimit) : totalDefaultStorageLimit.toNumber()
      );

      return await tezos.wallet.batch(opParams).send();
    },
    [basicParams, selectedFeeOption, totalDefaultStorageLimit]
  );

  const revealFee = estimationData?.revealFee ?? ZERO;
  const setRawTransaction = useCallback(async () => {
    try {
      if (simulateOperation) {
        setBalancesChangesLoading(true);
      }
      const sourcePublicKey = await tezos.wallet.pk();

      let bytesToSign: string | undefined;
      const signer = new ReadOnlySigner(accountPkh, sourcePublicKey, digest => {
        bytesToSign = digest;
      });

      const readOnlyTezos = new TezosToolkit(getTezosFastRpcClient(rpcBaseURL));
      readOnlyTezos.setSignerProvider(signer);
      readOnlyTezos.setPackerProvider(michelEncoder);

      await submitOperation(
        readOnlyTezos,
        debouncedGasFee,
        debouncedStorageLimit,
        revealFee,
        displayedFeeOptions
      ).catch(e => {
        console.error(e);

        return null;
      });

      if (bytesToSign) {
        const rawToSign = await localForger.parse(bytesToSign).catch(() => null);
        if (rawToSign && simulateOperation) {
          params$.next(rawToSign);
        } else if (simulateOperation) {
          setBalancesChangesLoading(false);
        }
        if (rawToSign) {
          setValue('raw', rawToSign);
        }
        setValue('bytes', bytesToSign);
      } else if (simulateOperation) {
        setBalancesChangesLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      setBalancesChangesLoading(false);
    }
  }, [
    accountPkh,
    displayedFeeOptions,
    debouncedGasFee,
    rpcBaseURL,
    setValue,
    debouncedStorageLimit,
    submitOperation,
    tezos,
    revealFee,
    simulateOperation,
    params$,
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
      const currentGasFeePreset = displayedFeeOptions?.[selectedFeeOption || 'mid'];

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

  return {
    balancesChanges,
    balancesChangesLoading,
    form,
    tab,
    setTab,
    selectedFeeOption,
    getFeeParams,
    handleFeeOptionSelect,
    submitOperation,
    displayedFeeOptions,
    displayedFee,
    displayedStorageFee
  };
};

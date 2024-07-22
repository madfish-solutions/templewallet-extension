import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import { ContractAbstraction, ContractProvider, Wallet } from '@taquito/taquito';
import clsx from 'clsx';
import { useForm } from 'react-hook-form';
import { useDebouncedCallback } from 'use-debounce';
import { getAddress, isAddress } from 'viem';

import { FormField, NoSpaceField } from 'app/atoms';
import { NetworkSelectButton } from 'app/atoms/NetworkSelectButton';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import Spinner from 'app/atoms/Spinner/Spinner';
import { StyledButton } from 'app/atoms/StyledButton';
import { dispatch } from 'app/store';
import { putNewEvmTokenAction } from 'app/store/evm/assets/actions';
import { putEvmTokensMetadataAction } from 'app/store/evm/tokens-metadata/actions';
import { setToastsContainerBottomShiftAction } from 'app/store/settings/actions';
import { putCollectiblesAsIsAction, putTokensAsIsAction } from 'app/store/tezos/assets/actions';
import { putCollectiblesMetadataAction } from 'app/store/tezos/collectibles-metadata/actions';
import { putTokensMetadataAction } from 'app/store/tezos/tokens-metadata/actions';
import { toastError, toastSuccess } from 'app/toaster';
import { useFormAnalytics } from 'lib/analytics';
import { TokenMetadataResponse } from 'lib/apis/temple';
import { toTokenSlug } from 'lib/assets';
import {
  assertFa2TokenDefined,
  detectTokenStandard,
  IncorrectTokenIdError,
  NotMatchingStandardError
} from 'lib/assets/standards';
import { fetchEvmTokenMetadataFromChain } from 'lib/evm/on-chain/metadata';
import { t, T } from 'lib/i18n';
import { isCollectible, TokenMetadata } from 'lib/metadata';
import { fetchOneTokenMetadata } from 'lib/metadata/fetch';
import { TokenMetadataNotFoundError } from 'lib/metadata/on-chain';
import { EvmTokenMetadata } from 'lib/metadata/types';
import { loadContract } from 'lib/temple/contract';
import { useSafeState } from 'lib/ui/hooks';
import { delay } from 'lib/utils';
import {
  EvmChain,
  TezosChain,
  useAccountAddressForEvm,
  useAccountAddressForTezos,
  useAllTezosChains
} from 'temple/front';
import { validateEvmContractAddress } from 'temple/front/evm/helpers';
import { validateTezosContractAddress } from 'temple/front/tezos';
import { getReadOnlyTezos } from 'temple/tezos';
import { TempleChainKind } from 'temple/types';

import { TokenInfo } from './TokenInfo';

type ComponentState = {
  processing: boolean;
  bottomSectionVisible: boolean;
  tokenValidationError: boolean;
  tokenDataError: boolean;
};

const INITIAL_STATE: ComponentState = {
  processing: false,
  bottomSectionVisible: false,
  tokenValidationError: false,
  tokenDataError: false
};

class ContractNotFoundError extends Error {}

interface RequiredTokenMetadataResponse extends TokenMetadataResponse {
  name: string;
  symbol: string;
}

interface RequiredEvmTokenMetadata extends EvmTokenMetadata {
  name: string;
  symbol: string;
}

interface FormData {
  address: string;
  id?: number;
}

interface AddTokenPageProps {
  selectedNetwork: EvmChain | TezosChain;
  onNetworkSelectClick: EmptyFn;
  close: EmptyFn;
}

export const AddTokenForm = memo<AddTokenPageProps>(({ selectedNetwork, onNetworkSelectClick, close }) => {
  const formAnalytics = useFormAnalytics('AddAsset');

  const isTezosChainSelected = selectedNetwork.kind === TempleChainKind.Tezos;

  const accountTezAddress = useAccountAddressForTezos();
  const accountEvmAddress = useAccountAddressForEvm();

  const tezosChains = useAllTezosChains();

  const { formState, register, errors, watch, setValue, triggerValidation, clearError, handleSubmit } =
    useForm<FormData>({
      mode: 'onChange'
    });

  const contractAddress = watch('address') || '';
  const tokenIdWithoutFallback = watch('id');
  const tokenId = tokenIdWithoutFallback || 0;

  const formValid = useMemo(() => {
    if (!contractAddress) return false;

    if (isTezosChainSelected) return validateTezosContractAddress(contractAddress) === true && tokenId >= 0;

    return isAddress(contractAddress);
  }, [contractAddress, isTezosChainSelected, tokenId]);

  const [{ processing, bottomSectionVisible, tokenValidationError, tokenDataError }, setState] =
    useSafeState(INITIAL_STATE);

  const isAddButtonDisabled =
    tokenValidationError ||
    tokenDataError ||
    (formState.isSubmitted && !formState.dirty) ||
    (formState.dirty && !formValid);

  const attemptRef = useRef(0);
  const tezMetadataRef = useRef<RequiredTokenMetadataResponse>();
  const evmMetadataRef = useRef<RequiredEvmTokenMetadata>();

  const loadMetadataPure = useCallback(async () => {
    if (!formValid) return;

    const attempt = ++attemptRef.current;
    setState({
      ...INITIAL_STATE,
      processing: true
    });

    let stateToSet: Partial<ComponentState>;

    try {
      if (isTezosChainSelected) {
        const rpcBaseURL = tezosChains[selectedNetwork.chainId]?.rpcBaseURL;

        const tezos = getReadOnlyTezos(rpcBaseURL);

        let contract: ContractAbstraction<Wallet | ContractProvider>;
        try {
          contract = await loadContract(tezos, contractAddress, false);
        } catch {
          throw new ContractNotFoundError();
        }

        const tokenStandard = await detectTokenStandard(tezos, contract);
        if (!tokenStandard) {
          throw new NotMatchingStandardError('Failed when detecting token standard');
        }

        if (tokenStandard === 'fa2') await assertFa2TokenDefined(tezos, contract, tokenId);

        const metadata = await fetchOneTokenMetadata(rpcBaseURL, contractAddress, String(tokenId));

        if (!metadata || !metadata.name || !metadata.symbol)
          throw new TokenMetadataNotFoundError('Failed to load token metadata');

        tezMetadataRef.current = metadata as RequiredTokenMetadataResponse;

        stateToSet = { bottomSectionVisible: true };
      } else {
        const tokenSlug = toTokenSlug(getAddress(contractAddress), 0);

        const metadata = await fetchEvmTokenMetadataFromChain(selectedNetwork, tokenSlug);

        if (!metadata || !metadata.name || !metadata.symbol)
          throw new TokenMetadataNotFoundError('Failed to load token metadata');

        evmMetadataRef.current = metadata as RequiredEvmTokenMetadata;

        stateToSet = { bottomSectionVisible: true };
      }
    } catch (err: any) {
      console.error(err);

      await delay();

      stateToSet = errorHandler(err, contractAddress);
    }

    if (attempt === attemptRef.current) {
      setState(currentState => ({
        ...currentState,
        ...stateToSet,
        processing: false
      }));
    }
  }, [formValid, isTezosChainSelected, tezosChains, selectedNetwork, tokenId, contractAddress]);

  const loadMetadata = useDebouncedCallback(loadMetadataPure, 500);

  const loadMetadataRef = useRef(loadMetadata);
  useEffect(() => {
    loadMetadataRef.current = loadMetadata;
  }, [loadMetadata]);

  useEffect(() => {
    if (formValid) {
      clearError();
      loadMetadataRef.current();
    } else {
      setState(INITIAL_STATE);
      attemptRef.current++;
    }
  }, [formValid, selectedNetwork, contractAddress, tokenId, clearError]);

  const cleanContractAddress = useCallback(() => {
    setValue('address', '');
    triggerValidation('address');
  }, [setValue, triggerValidation]);

  const cleanTokenId = useCallback(() => {
    setValue('id', undefined);
  }, [setValue]);

  const onSubmit = useCallback(
    async ({ address, id }: FormData) => {
      if (formState.isSubmitting) return;

      formAnalytics.trackSubmit();
      try {
        if (isTezosChainSelected) {
          if (!tezMetadataRef.current) throw new Error('Oops, Something went wrong!');

          const tokenSlug = toTokenSlug(address, id || 0);

          const decimals = tezMetadataRef.current?.decimals;

          const tokenMetadata: TokenMetadata = {
            ...tezMetadataRef.current,
            decimals: decimals ? +decimals : 0,
            address: contractAddress,
            id: String(tokenId)
          };

          const assetIsCollectible = isCollectible(tokenMetadata);

          const actionPayload = { records: { [tokenSlug]: tokenMetadata } };
          if (assetIsCollectible) dispatch(putCollectiblesMetadataAction(actionPayload));
          else dispatch(putTokensMetadataAction(actionPayload));

          const asset = {
            chainId: selectedNetwork.chainId,
            account: accountTezAddress!,
            slug: tokenSlug,
            status: 'enabled' as const
          };

          dispatch(assetIsCollectible ? putCollectiblesAsIsAction([asset]) : putTokensAsIsAction([asset]));
          dispatch(setToastsContainerBottomShiftAction(0));
          toastSuccess(assetIsCollectible ? 'NFT Added' : 'Token Added');
        } else {
          if (!evmMetadataRef.current) throw new Error('Oops, Something went wrong!');

          const tokenSlug = toTokenSlug(getAddress(contractAddress), 0);

          dispatch(
            putNewEvmTokenAction({
              publicKeyHash: accountEvmAddress!,
              chainId: selectedNetwork.chainId,
              assetSlug: tokenSlug
            })
          );
          dispatch(
            putEvmTokensMetadataAction({
              chainId: selectedNetwork.chainId,
              records: { [tokenSlug]: evmMetadataRef.current }
            })
          );
          dispatch(setToastsContainerBottomShiftAction(0));
          toastSuccess('Token Added');
        }

        formAnalytics.trackSubmitSuccess();
        close();
      } catch (err: any) {
        console.error(err);

        formAnalytics.trackSubmitFail();

        toastError(err.message);
      }
    },
    [
      formState.isSubmitting,
      formAnalytics,
      isTezosChainSelected,
      contractAddress,
      tokenId,
      selectedNetwork.chainId,
      accountTezAddress,
      close,
      accountEvmAddress
    ]
  );

  return (
    <form className="flex flex-col w-full h-full" onSubmit={handleSubmit(onSubmit)}>
      <div className="px-4 flex-1 overflow-y-auto">
        <p className="mt-4 pt-1 pb-2 pl-1 text-font-description-bold">
          <T id="network" />
        </p>
        <NetworkSelectButton selectedChain={selectedNetwork} onClick={onNetworkSelectClick} />
        <p className="mt-6 pt-1 pb-2 pl-1 text-font-description-bold">
          <T id="tokenAddress" />
        </p>

        <NoSpaceField
          ref={register({
            required: t('required'),
            validate: isTezosChainSelected ? validateTezosContractAddress : validateEvmContractAddress
          })}
          name="address"
          id="addtoken-address"
          textarea
          rows={2}
          cleanable={Boolean(contractAddress)}
          onClean={cleanContractAddress}
          placeholder={isTezosChainSelected ? 'KT1v9CmPy…' : '0x0f5d2fb2…'}
          errorCaption={errors.address?.message}
          containerClassName="mb-6"
          className="resize-none"
        />

        {isTezosChainSelected && (
          <>
            <div className="mt-6 pt-1 pb-2 px-1 flex flex-row justify-between items-center">
              <p className="text-font-description-bold">
                <T id="tokenId" />
              </p>
              <p className="text-grey-2 text-font-description">
                <T id="optional" />
              </p>
            </div>
            <FormField
              ref={register({
                min: { value: 0, message: t('nonNegativeIntMessage') }
              })}
              min={0}
              type="number"
              name="id"
              id="token-id"
              placeholder="0"
              cleanable={Boolean(tokenIdWithoutFallback) || tokenIdWithoutFallback === 0}
              onClean={cleanTokenId}
              errorCaption={errors.id?.message}
              containerClassName="mb-6"
            />
          </>
        )}

        {processing && (
          <div className="my-8 w-full flex items-center justify-center pb-4">
            <div>
              <Spinner theme="gray" className="w-20" />
            </div>
          </div>
        )}

        <div
          className={clsx('w-full', {
            hidden: !bottomSectionVisible || processing
          })}
        >
          <TokenInfo
            name={isTezosChainSelected ? tezMetadataRef.current?.name : evmMetadataRef.current?.name}
            decimals={isTezosChainSelected ? tezMetadataRef.current?.decimals : evmMetadataRef.current?.decimals}
            symbol={isTezosChainSelected ? tezMetadataRef.current?.symbol : evmMetadataRef.current?.symbol}
          />
        </div>
      </div>
      <ActionsButtonsBox flexDirection="row" className="gap-x-2.5">
        <StyledButton size="L" className="w-full" color="primary-low" onClick={close}>
          <T id="cancel" />
        </StyledButton>
        <StyledButton disabled={isAddButtonDisabled} type="submit" size="L" className="w-full" color="primary">
          <T id="add" />
        </StyledButton>
      </ActionsButtonsBox>
    </form>
  );
});

const errorHandler = (err: any, contractAddress: string) => {
  if (err instanceof ContractNotFoundError) {
    toastError(t('referredByTokenContractNotFound', contractAddress));

    return { tokenValidationError: true };
  }

  if (err instanceof NotMatchingStandardError) {
    const errorMessage = err instanceof IncorrectTokenIdError ? `: ${err.message}` : '';
    toastError(`${t('tokenDoesNotMatchStandard', 'FA')}${errorMessage}`);

    return { tokenValidationError: true };
  }

  const errorMessage = t(
    err instanceof TokenMetadataNotFoundError ? 'failedToParseMetadata' : 'unknownParseErrorOccurred'
  );

  toastError(errorMessage);

  return { tokenDataError: true };
};

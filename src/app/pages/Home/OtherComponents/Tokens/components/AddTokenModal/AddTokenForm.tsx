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
import { ReactComponent as ErrorIcon } from 'app/icons/typed-msg/error.svg';
import { dispatch } from 'app/store';
import { putNewEvmCollectibleAction, putNewEvmTokenAction } from 'app/store/evm/assets/actions';
import { putEvmCollectiblesMetadataAction } from 'app/store/evm/collectibles-metadata/actions';
import { putEvmTokensMetadataAction } from 'app/store/evm/tokens-metadata/actions';
import { putCollectiblesAsIsAction, putTokensAsIsAction } from 'app/store/tezos/assets/actions';
import { useMainnetTokensScamlistSelector } from 'app/store/tezos/assets/selectors';
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
import { fetchEvmCollectibleMetadataFromChain, fetchEvmTokenMetadataFromChain } from 'lib/evm/on-chain/metadata';
import { t, T } from 'lib/i18n';
import { isCollectible, TokenMetadata } from 'lib/metadata';
import { fetchOneTokenMetadata } from 'lib/metadata/fetch';
import { TokenMetadataNotFoundError } from 'lib/metadata/on-chain';
import { EvmCollectibleMetadata, EvmTokenMetadata } from 'lib/metadata/types';
import { loadContract } from 'lib/temple/contract';
import { useToastsContainerBottomShift } from 'lib/temple/front/toasts-context';
import { useConfirm } from 'lib/ui/dialog';
import { useSafeState, useUpdatableRef } from 'lib/ui/hooks';
import { navigate } from 'lib/woozie';
import { OneOfChains, useAccountAddressForEvm, useAccountAddressForTezos } from 'temple/front';
import { validateEvmContractAddress } from 'temple/front/evm/helpers';
import { validateTezosContractAddress } from 'temple/front/tezos';
import { getReadOnlyTezos } from 'temple/tezos';
import { TempleChainKind } from 'temple/types';

import { toExploreAssetLink } from '../../utils';

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

interface RequiredMetadata {
  name: string;
  symbol: string;
}

type RequiredEvmTokenMetadata = EvmTokenMetadata & RequiredMetadata;
type RequiredEvmCollectibleMetadata = EvmCollectibleMetadata & RequiredMetadata;

interface FormData {
  address: string;
  id?: string;
}

interface AddTokenPageProps {
  forCollectible: boolean;
  selectedNetwork: OneOfChains;
  onNetworkSelectClick: EmptyFn;
  close: EmptyFn;
}

export const AddTokenForm = memo<AddTokenPageProps>(
  ({ forCollectible, selectedNetwork, onNetworkSelectClick, close }) => {
    const formAnalytics = useFormAnalytics('AddAsset');

    const isTezosChainSelected = selectedNetwork.kind === TempleChainKind.Tezos;

    const mainnetTokensScamSlugsRecord = useMainnetTokensScamlistSelector();
    const confirm = useConfirm();

    const accountTezAddress = useAccountAddressForTezos();
    const accountEvmAddress = useAccountAddressForEvm();

    const [_, setToastsContainerBottomShift] = useToastsContainerBottomShift();

    const { formState, register, errors, watch, setValue, triggerValidation, clearError, handleSubmit } =
      useForm<FormData>({
        mode: 'onChange'
      });

    const contractAddress = watch('address') || '';
    const tokenIdWithoutFallback = watch('id');
    const tokenId = tokenIdWithoutFallback || '0';

    const showScamTokenAlert = mainnetTokensScamSlugsRecord[toTokenSlug(contractAddress, tokenId)];

    const formValid = useMemo(() => {
      if (!contractAddress) return false;

      if (isTezosChainSelected) return validateTezosContractAddress(contractAddress) === true && Number(tokenId) >= 0;

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
    const evmMetadataRef = useRef<RequiredEvmTokenMetadata | RequiredEvmCollectibleMetadata>();

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
          const tezos = getReadOnlyTezos(selectedNetwork);

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

          const metadata = await fetchOneTokenMetadata(selectedNetwork, contractAddress, String(tokenId));

          if (!metadata || !metadata.name || !metadata.symbol)
            throw new TokenMetadataNotFoundError('Failed to load token metadata');

          tezMetadataRef.current = metadata as RequiredTokenMetadataResponse;

          stateToSet = { bottomSectionVisible: true };
        } else {
          const tokenSlug = toTokenSlug(getAddress(contractAddress), tokenId);

          const metadata = await (forCollectible
            ? fetchEvmCollectibleMetadataFromChain
            : fetchEvmTokenMetadataFromChain)(selectedNetwork, tokenSlug);

          if (!metadata || !hasRequiredMetadata(metadata))
            throw new TokenMetadataNotFoundError('Failed to load token metadata');

          evmMetadataRef.current = metadata;

          stateToSet = { bottomSectionVisible: true };
        }
      } catch (err: any) {
        console.error(err);

        stateToSet = errorHandler(err, contractAddress);
      }

      if (attempt === attemptRef.current) {
        setState(currentState => ({
          ...currentState,
          ...stateToSet,
          processing: false
        }));
      }
    }, [formValid, isTezosChainSelected, selectedNetwork, tokenId, contractAddress, setState, forCollectible]);

    const loadMetadata = useDebouncedCallback(loadMetadataPure, 500);

    const loadMetadataRef = useUpdatableRef(loadMetadata);

    useEffect(() => {
      if (formValid) {
        clearError();
        loadMetadataRef.current();
      } else {
        setState(INITIAL_STATE);
        attemptRef.current++;
      }
    }, [formValid, selectedNetwork, contractAddress, tokenId, clearError, setState]);

    const cleanContractAddress = useCallback(() => {
      setValue('address', '');
      triggerValidation('address');
    }, [setValue, triggerValidation]);

    const cleanTokenId = useCallback(() => {
      setValue('id', undefined);
    }, [setValue]);

    const onSubmit = useCallback(
      async ({ address, id = '0' }: FormData) => {
        if (formState.isSubmitting) return;

        if (showScamTokenAlert) {
          const confirmed = await confirm({
            hasCancelButton: false,
            confirmButtonColor: 'red-low',
            confirmButtonText: t('continue'),
            title: t('scamTokenAlert'),
            description: t('scamTokenTooltip')
          });
          if (!confirmed) return;
        }

        formAnalytics.trackSubmit();

        let assetIsCollectible = false;
        let tokenSlug: string;

        try {
          if (isTezosChainSelected) {
            if (!tezMetadataRef.current) throw new Error('Oops, Something went wrong!');

            tokenSlug = toTokenSlug(address, id);

            const decimals = tezMetadataRef.current?.decimals;

            const tokenMetadata: TokenMetadata = {
              ...tezMetadataRef.current,
              decimals: decimals ? +decimals : 0,
              address,
              id
            };

            assetIsCollectible = isCollectible(tokenMetadata);

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
          } else {
            if (!evmMetadataRef.current) throw new Error('Oops, Something went wrong!');

            tokenSlug = toTokenSlug(getAddress(address), id);

            dispatch(
              (forCollectible ? putNewEvmCollectibleAction : putNewEvmTokenAction)({
                publicKeyHash: accountEvmAddress!,
                chainId: selectedNetwork.chainId,
                assetSlug: tokenSlug
              })
            );

            if (forCollectible)
              dispatch(
                putEvmCollectiblesMetadataAction({
                  chainId: selectedNetwork.chainId,
                  records: {
                    [tokenSlug]: { ...(evmMetadataRef.current as RequiredEvmCollectibleMetadata), tokenId: id }
                  }
                })
              );
            else
              dispatch(
                putEvmTokensMetadataAction({
                  chainId: selectedNetwork.chainId,
                  records: { [tokenSlug]: evmMetadataRef.current as RequiredEvmTokenMetadata }
                })
              );
          }

          setToastsContainerBottomShift(0);
          toastSuccess(assetIsCollectible ? 'NFT Added' : 'Token Added');

          formAnalytics.trackSubmitSuccess();

          setTimeout(
            () =>
              // Queueing navigation to let redux state mutate prior to it.
              navigate(toExploreAssetLink(forCollectible, selectedNetwork.kind, selectedNetwork.chainId, tokenSlug)),
            0
          );

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
        setToastsContainerBottomShift,
        close,
        selectedNetwork.chainId,
        selectedNetwork.kind,
        accountTezAddress,
        forCollectible,
        accountEvmAddress,
        showScamTokenAlert
      ]
    );

    return (
      <form className="contents" onSubmit={handleSubmit(onSubmit)}>
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
            containerClassName={forCollectible || isTezosChainSelected ? 'mb-3' : 'mb-1'}
            className="resize-none"
          />

          {(forCollectible || isTezosChainSelected) && (
            <>
              <div className="pt-1 pb-2 px-1 flex flex-row justify-between items-center">
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
                cleanable={Boolean(tokenIdWithoutFallback) || tokenIdWithoutFallback === '0'}
                onClean={cleanTokenId}
                errorCaption={errors.id?.message}
                containerClassName="mb-1"
              />
            </>
          )}

          {processing && (
            <div className="my-8 flex items-center justify-center pb-4">
              <div>
                <Spinner theme="gray" className="w-20" />
              </div>
            </div>
          )}

          <div
            className={clsx({
              hidden: !bottomSectionVisible || processing
            })}
          >
            {showScamTokenAlert && (
              <div className="p-4 mb-4 rounded-md flex items-center justify-between bg-error-low">
                <span className="flex items-start">
                  <ErrorIcon className="shrink-0 w-6 h-6" />

                  <div className="ml-1 flex flex-col gap-0.5">
                    <p className="text-font-description-bold">
                      <T id="scamTokenAlert" />
                    </p>
                    <p className="text-font-description">
                      <T id="addScamTokenWarning" />
                    </p>
                  </div>
                </span>
              </div>
            )}
            <TokenInfo
              name={isTezosChainSelected ? tezMetadataRef.current?.name : evmMetadataRef.current?.name}
              decimals={isTezosChainSelected ? tezMetadataRef.current?.decimals : evmMetadataRef.current?.decimals}
              symbol={isTezosChainSelected ? tezMetadataRef.current?.symbol : evmMetadataRef.current?.symbol}
            />
          </div>
        </div>

        <ActionsButtonsBox>
          <StyledButton disabled={isAddButtonDisabled} type="submit" size="L" className="w-full" color="primary">
            <T id="add" />
          </StyledButton>
        </ActionsButtonsBox>
      </form>
    );
  }
);

const hasRequiredMetadata = (
  metadata: EvmTokenMetadata | EvmCollectibleMetadata
): metadata is RequiredEvmCollectibleMetadata | RequiredEvmTokenMetadata => Boolean(metadata.name && metadata.symbol);

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

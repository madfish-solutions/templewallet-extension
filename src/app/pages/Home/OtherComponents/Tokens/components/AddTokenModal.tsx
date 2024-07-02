import React, { FC, memo, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { EmptyFn } from '@rnw-community/shared';
import { ContractAbstraction, ContractProvider, Wallet } from '@taquito/taquito';
import clsx from 'clsx';
import { useForm } from 'react-hook-form';
import { useDebouncedCallback } from 'use-debounce';
import { getAddress } from 'viem';

import { Alert, FormField, IconBase, NoSpaceField } from 'app/atoms';
import { IconButton } from 'app/atoms/IconButton';
import { EvmNetworkLogo, NetworkLogoFallback } from 'app/atoms/NetworkLogo';
import { TezosNetworkLogo } from 'app/atoms/NetworksLogos';
import { PageModal } from 'app/atoms/PageModal';
import { RadioButton } from 'app/atoms/RadioButton';
import Spinner from 'app/atoms/Spinner/Spinner';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as CompactDown } from 'app/icons/base/compact_down.svg';
import { ReactComponent as PlusIcon } from 'app/icons/base/plus.svg';
import { dispatch } from 'app/store';
import { putNewEvmTokenAction } from 'app/store/evm/assets/actions';
import { putEvmTokensMetadataAction } from 'app/store/evm/tokens-metadata/actions';
import { putTokensAsIsAction } from 'app/store/tezos/assets/actions';
import { putTokensMetadataAction } from 'app/store/tezos/tokens-metadata/actions';
import { searchAndFilterNetworks } from 'app/templates/AssetsFilterOptions/utils/search-and-filter-networks';
import { SearchBarField } from 'app/templates/SearchField';
import { toastSuccess } from 'app/toaster';
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
import { TokenMetadata } from 'lib/metadata';
import { fetchOneTokenMetadata } from 'lib/metadata/fetch';
import { TokenMetadataNotFoundError } from 'lib/metadata/on-chain';
import { EvmTokenMetadata } from 'lib/metadata/types';
import { loadContract } from 'lib/temple/contract';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useBooleanState, useSafeState } from 'lib/ui/hooks';
import { useScrollIntoViewOnMount } from 'lib/ui/use-scroll-into-view';
import { delay } from 'lib/utils';
import { navigate } from 'lib/woozie';
import {
  EvmChain,
  TezosChain,
  useAccountAddressForEvm,
  useAccountAddressForTezos,
  useAllEvmChains,
  useAllTezosChains,
  useEnabledEvmChains,
  useEnabledTezosChains,
  useEthereumMainnetChain,
  useTezosMainnetChain
} from 'temple/front';
import { validateTezosContractAddress } from 'temple/front/tezos';
import { getReadOnlyTezos } from 'temple/tezos';
import { TempleChainKind } from 'temple/types';

type SelectedChain = EvmChain | TezosChain;

interface Props {
  opened: boolean;
  onRequestClose: EmptyFn;
}

export const AddTokenModal = memo<Props>(({ opened, onRequestClose }) => {
  const accountTezAddress = useAccountAddressForTezos();
  const accountEvmAddress = useAccountAddressForEvm();

  const tezosMainnetChain = useTezosMainnetChain();
  const ethMainnetChain = useEthereumMainnetChain();

  const defaultSelectedChain = useMemo(() => {
    if (accountTezAddress && accountEvmAddress) return tezosMainnetChain;
    if (accountTezAddress) return tezosMainnetChain;

    return ethMainnetChain;
  }, [accountEvmAddress, accountTezAddress, ethMainnetChain, tezosMainnetChain]);

  const [isNetworkSelectOpened, setNetworkSelectOpened, setNetworkSelectClosed] = useBooleanState(false);
  const [selectedChain, setSelectedChain] = useState<SelectedChain>(defaultSelectedChain);

  return (
    <PageModal
      title={isNetworkSelectOpened ? 'Select Network' : 'Add Custom Token'}
      opened={opened}
      onBackClick={isNetworkSelectOpened ? setNetworkSelectClosed : undefined}
      onRequestClose={onRequestClose}
    >
      {isNetworkSelectOpened ? (
        <SelectNetworkPage
          selectedChain={selectedChain}
          setSelectedChain={setSelectedChain}
          onCloseClick={setNetworkSelectClosed}
        />
      ) : (
        <AddTokenForm
          selectedChain={selectedChain}
          onNetworkSelectClick={setNetworkSelectOpened}
          onCanselClick={onRequestClose}
        />
      )}
    </PageModal>
  );
});

type ComponentState = {
  processing: boolean;
  bottomSectionVisible: boolean;
  tokenValidationError: ReactNode;
  tokenDataError: ReactNode;
};

const INITIAL_STATE: ComponentState = {
  processing: false,
  bottomSectionVisible: false,
  tokenValidationError: null,
  tokenDataError: null
};

class ContractNotFoundError extends Error {}

interface FormData {
  address: string;
  id?: number;
}

interface AddTokenPageProps {
  selectedChain: SelectedChain;
  onNetworkSelectClick: EmptyFn;
  onCanselClick: EmptyFn;
}

const AddTokenForm = memo<AddTokenPageProps>(({ selectedChain, onNetworkSelectClick, onCanselClick }) => {
  const formAnalytics = useFormAnalytics('AddAsset');

  const isTezosChainSelected = selectedChain.kind === TempleChainKind.Tezos;

  const accountTezAddress = useAccountAddressForTezos();
  const accountEvmAddress = useAccountAddressForEvm();

  const tezosChains = useAllTezosChains();

  const { formState, register, errors, watch, setValue, triggerValidation, clearError, handleSubmit } =
    useForm<FormData>({
      mode: 'onChange'
    });

  const contractAddress = watch('address') || '';
  const tokenId = watch('id') || 0;

  const formValid = useMemo(() => {
    if (isTezosChainSelected) return validateTezosContractAddress(contractAddress) === true && tokenId >= 0;

    return contractAddress.startsWith('0x');
  }, [contractAddress, isTezosChainSelected, tokenId]);

  const [{ processing, bottomSectionVisible, tokenValidationError, tokenDataError }, setState] =
    useSafeState(INITIAL_STATE);
  const [submitError, setSubmitError] = useSafeState<ReactNode>(null);

  const attemptRef = useRef(0);
  const tezMetadataRef = useRef<TokenMetadataResponse>();
  const evmMetadataRef = useRef<EvmTokenMetadata>();

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
        const rpcBaseURL = tezosChains[selectedChain.chainId]?.rpcBaseURL;

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

        if (metadata) {
          tezMetadataRef.current = metadata;
        }

        stateToSet = {
          bottomSectionVisible: true
        };
      } else {
        const tokenSlug = toTokenSlug(getAddress(contractAddress), 0);

        const metadata = await fetchEvmTokenMetadataFromChain(selectedChain, tokenSlug);

        if (metadata) {
          evmMetadataRef.current = metadata;
        }

        stateToSet = {
          bottomSectionVisible: true
        };
      }
    } catch (err: any) {
      console.error(err);

      await delay();

      stateToSet = errorHandler(err, contractAddress, setValue);
    }

    if (attempt === attemptRef.current) {
      setState(currentState => ({
        ...currentState,
        ...stateToSet,
        processing: false
      }));
    }
  }, [selectedChain, setValue, setState, formValid, contractAddress, tokenId]);

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
  }, [setState, formValid, selectedChain, contractAddress, tokenId]);

  const cleanContractAddress = useCallback(() => {
    setValue('address', '');
    triggerValidation('address');
  }, [setValue, triggerValidation]);

  const onSubmit = useCallback(
    async ({ address, id }: FormData) => {
      if (formState.isSubmitting) return;

      setSubmitError(null);

      formAnalytics.trackSubmit();
      try {
        if (isTezosChainSelected) {
          const tokenSlug = toTokenSlug(address, id || 0);

          const baseMetadata = {
            symbol: tezMetadataRef.current?.symbol ?? '???',
            name: tezMetadataRef.current?.name ?? 'Unknown Token',
            decimals: tezMetadataRef.current?.decimals ?? 0,
            thumbnailUri: tezMetadataRef.current?.thumbnailUri
          };

          const tokenMetadata: TokenMetadata = {
            ...baseMetadata,
            address: contractAddress,
            id: String(tokenId)
          };

          const actionPayload = { records: { [tokenSlug]: tokenMetadata } };
          dispatch(putTokensMetadataAction(actionPayload));

          const asset = {
            chainId: selectedChain.chainId,
            account: accountTezAddress!,
            slug: tokenSlug,
            status: 'enabled' as const
          };

          console.log(asset, 'asset');

          dispatch(putTokensAsIsAction([asset]));

          formAnalytics.trackSubmitSuccess();

          toastSuccess('Token Added');

          onCanselClick();
        } else {
          const tokenSlug = toTokenSlug(getAddress(contractAddress), 0);

          dispatch(
            putNewEvmTokenAction({
              publicKeyHash: accountEvmAddress!,
              chainId: selectedChain.chainId,
              assetSlug: tokenSlug
            })
          );
          dispatch(
            putEvmTokensMetadataAction({
              chainId: selectedChain.chainId,
              records: { [tokenSlug]: evmMetadataRef.current }
            })
          );

          formAnalytics.trackSubmitSuccess();

          toastSuccess('Token Added');

          onCanselClick();
        }
      } catch (err: any) {
        console.error(err);

        formAnalytics.trackSubmitFail();

        setSubmitError(err.message);
      }
    },
    [
      formState.isSubmitting,
      setSubmitError,
      formAnalytics,
      isTezosChainSelected,
      contractAddress,
      tokenId,
      selectedChain.chainId,
      accountTezAddress,
      onCanselClick,
      accountEvmAddress
    ]
  );

  return (
    <form className="flex flex-col w-full h-full" onSubmit={handleSubmit(onSubmit)}>
      <div className="px-4 flex-1 overflow-y-auto">
        <p className="mt-4 pt-1 pb-2 pl-1 text-font-description-bold">
          <T id="network" />
        </p>
        <NetworkSelect selectedChain={selectedChain} onClick={onNetworkSelectClick} />
        <p className="mt-6 pt-1 pb-2 pl-1 text-font-description-bold">
          <T id="tokenAddress" />
        </p>

        <NoSpaceField
          ref={register({
            required: t('required')
            //validate: validateTezosContractAddress
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

        {tokenValidationError && (
          <Alert type="error" title={t('error')} autoFocus description={tokenValidationError} className="mb-8" />
        )}

        {tokenDataError && (
          <Alert
            type="warning"
            title={t('failedToParseMetadata')}
            autoFocus
            description={tokenDataError}
            className="mb-8"
          />
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

        {submitError && <Alert type="error" title={t('error')} autoFocus description={submitError} className="mb-6" />}
      </div>
      <div className="flex flex-row gap-x-2.5 p-4 pb-6 bg-white">
        <StyledButton size="L" className="w-full" color="primary-low" onClick={onCanselClick}>
          <T id="cancel" />
        </StyledButton>
        <StyledButton type="submit" size="L" className="w-full" color="primary">
          <T id="add" />
        </StyledButton>
      </div>
    </form>
  );
});

interface TokenInfoProps {
  name?: string;
  decimals?: number;
  symbol?: string;
}

const TokenInfo = memo<TokenInfoProps>(({ name, decimals, symbol }) => (
  <div className="flex flex-col px-4 pt-4 pb-2 mb-6 rounded-lg shadow-bottom border-0.5 border-transparent">
    <p className="p-1 text-font-description-bold text-grey-2">
      <T id="tokenInfo" />
    </p>
    <div className="w-full">
      <div className="py-2 flex flex-row justify-between items-center border-b-0.5 border-lines">
        <p className="p-1 text-font-description text-grey-1">
          <T id="name" />
        </p>
        <p className="p-1 text-font-description-bold">{name}</p>
      </div>

      <div className="py-2 flex flex-row justify-between items-center border-b-0.5 border-lines">
        <p className="p-1 text-font-description text-grey-1">
          <T id="decimals" />
        </p>
        <p className="p-1 text-font-description-bold">{decimals}</p>
      </div>

      <div className="py-2 flex flex-row justify-between items-center">
        <p className="p-1 text-font-description text-grey-1">
          <T id="symbol" />
        </p>
        <p className="p-1 text-font-description-bold">{symbol}</p>
      </div>
    </div>
  </div>
));

interface SelectNetworkPageProps {
  selectedChain: SelectedChain;
  setSelectedChain: React.Dispatch<React.SetStateAction<SelectedChain>>;
  onCloseClick: EmptyFn;
}

const SelectNetworkPage: FC<SelectNetworkPageProps> = ({ selectedChain, setSelectedChain, onCloseClick }) => {
  const accountTezAddress = useAccountAddressForTezos();
  const accountEvmAddress = useAccountAddressForEvm();

  const tezosChains = useEnabledTezosChains();
  const evmChains = useEnabledEvmChains();

  const sortedNetworks = useMemo(
    () => [...(accountTezAddress ? tezosChains : []), ...(accountEvmAddress ? evmChains : [])],
    [accountEvmAddress, accountTezAddress, evmChains, tezosChains]
  );

  const [searchValue, setSearchValue] = useState('');

  const filteredNetworks = useMemo(
    () => (searchValue.length ? searchAndFilterNetworks<SelectedChain>(sortedNetworks, searchValue) : sortedNetworks),
    [searchValue, sortedNetworks]
  );

  return (
    <>
      <div className="flex gap-x-2 p-4">
        <SearchBarField value={searchValue} onValueChange={setSearchValue} />

        <IconButton Icon={PlusIcon} color="blue" onClick={() => void navigate('settings/networks')} />
      </div>

      <div className="px-4 flex-1 flex flex-col overflow-y-auto">
        {filteredNetworks.map(network => {
          if (network.kind === TempleChainKind.Tezos) {
            return (
              <Network
                key={network.chainId}
                active={selectedChain?.kind === TempleChainKind.Tezos && selectedChain.chainId === network.chainId}
                icon={
                  network.chainId === TEZOS_MAINNET_CHAIN_ID ? (
                    <TezosNetworkLogo size={24} />
                  ) : (
                    <NetworkLogoFallback networkName={network.name} size={24} />
                  )
                }
                name={network.name}
                attractSelf
                onClick={() => setSelectedChain(network)}
              />
            );
          }

          return (
            <Network
              key={network.chainId}
              active={selectedChain?.kind === TempleChainKind.EVM && selectedChain.chainId === network.chainId}
              icon={
                <EvmNetworkLogo networkName={network.name} chainId={network.chainId} size={24} imgClassName="p-0.5" />
              }
              name={network.name}
              attractSelf
              onClick={() => setSelectedChain(network)}
            />
          );
        })}
      </div>

      <div className="p-4 pb-6 flex flex-col bg-white">
        <StyledButton size="L" color="primary-low" onClick={onCloseClick}>
          <T id="close" />
        </StyledButton>
      </div>
    </>
  );
};

interface NetworkProps {
  active: boolean;
  icon: JSX.Element;
  name: string;
  attractSelf: boolean;
  onClick: EmptyFn;
}

const Network: FC<NetworkProps> = ({ active, icon, name, attractSelf, onClick }) => {
  const elemRef = useScrollIntoViewOnMount<HTMLDivElement>(active && attractSelf);

  return (
    <div
      ref={elemRef}
      className="cursor-pointer mb-3 flex justify-between items-center p-3 rounded-lg shadow-bottom border-0.5 border-transparent group"
      onClick={onClick}
    >
      <div className="flex items-center gap-x-2">
        {icon}
        <span className="text-font-medium-bold">{name}</span>
      </div>
      <RadioButton active={active} className={active ? undefined : 'opacity-0 group-hover:opacity-100'} />
    </div>
  );
};

interface NetworkSelectProps {
  selectedChain: SelectedChain;
  onClick: EmptyFn;
}

const NetworkSelect = memo<NetworkSelectProps>(({ selectedChain, onClick }) => {
  const tezosChains = useAllTezosChains();
  const evmChains = useAllEvmChains();

  const children: JSX.Element = useMemo(() => {
    if (selectedChain.kind === TempleChainKind.Tezos) {
      const networkName = tezosChains[selectedChain.chainId].name;

      return (
        <>
          {selectedChain.chainId === TEZOS_MAINNET_CHAIN_ID ? (
            <TezosNetworkLogo size={24} />
          ) : (
            <NetworkLogoFallback networkName={networkName} />
          )}
          <span className="text-font-medium-bold">{networkName}</span>
        </>
      );
    }

    const networkName = evmChains[selectedChain.chainId].name;

    return (
      <>
        <EvmNetworkLogo networkName={networkName} chainId={selectedChain.chainId} size={24} imgClassName="p-0.5" />
        <span className="text-font-medium-bold">{networkName}</span>
      </>
    );
  }, [selectedChain, evmChains, tezosChains]);

  return (
    <div
      className="cursor-pointer flex justify-between items-center p-3 rounded-lg shadow-bottom border-0.5 border-transparent hover:border-lines"
      onClick={onClick}
    >
      <div className="flex items-center gap-2">{children}</div>
      <IconBase Icon={CompactDown} className="text-primary" size={16} />
    </div>
  );
});

const errorHandler = (err: any, contractAddress: string, setValue: any) => {
  if (err instanceof ContractNotFoundError)
    return {
      tokenValidationError: t('referredByTokenContractNotFound', contractAddress)
    };

  if (err instanceof NotMatchingStandardError) {
    const errorMessage = err instanceof IncorrectTokenIdError ? `: ${err.message}` : '';
    return {
      tokenValidationError: `${t('tokenDoesNotMatchStandard', 'FA')}${errorMessage}`
    };
  }

  const errorMessage = t(
    err instanceof TokenMetadataNotFoundError ? 'failedToParseMetadata' : 'unknownParseErrorOccurred'
  );
  setValue([{ symbol: '' }, { name: '' }, { decimals: 0 }]);

  return {
    bottomSectionVisible: true,
    tokenDataError: errorMessage
  };
};

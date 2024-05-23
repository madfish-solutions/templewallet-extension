import React, { FC, memo, ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';

import { ContractAbstraction, ContractProvider, Wallet } from '@taquito/taquito';
import classNames from 'clsx';
import { FormContextValues, useForm } from 'react-hook-form';
import { useDebouncedCallback } from 'use-debounce';

import { Alert, FormField, FormSubmitButton, NoSpaceField, PageTitle } from 'app/atoms';
import Spinner from 'app/atoms/Spinner/Spinner';
import { ReactComponent as AddIcon } from 'app/icons/base/plus_circle.svg';
import PageLayout from 'app/layouts/PageLayout';
import { dispatch } from 'app/store';
import { putNewEvmCollectibleAction, putNewEvmTokenAction } from 'app/store/evm/assets/actions';
import { putEvmCollectiblesMetadataAction } from 'app/store/evm/collectibles-metadata/actions';
import { putEvmTokensMetadataAction } from 'app/store/evm/tokens-metadata/actions';
import { putCollectiblesAsIsAction, putTokensAsIsAction } from 'app/store/tezos/assets/actions';
import { putCollectiblesMetadataAction } from 'app/store/tezos/collectibles-metadata/actions';
import { putTokensMetadataAction } from 'app/store/tezos/tokens-metadata/actions';
import { ChainSelectSection, useChainSelectController } from 'app/templates/ChainSelect';
import { useFormAnalytics } from 'lib/analytics';
import { TokenMetadataResponse } from 'lib/apis/temple';
import { toTokenSlug } from 'lib/assets';
import {
  assertFa2TokenDefined,
  detectTokenStandard,
  IncorrectTokenIdError,
  NotMatchingStandardError
} from 'lib/assets/standards';
import { fetchEvmAssetMetadataFromChain } from 'lib/evm/on-chain/metadata';
import { EvmAssetStandard } from 'lib/evm/types';
import { T, t } from 'lib/i18n';
import { isCollectible, TokenMetadata } from 'lib/metadata';
import { fetchOneTokenMetadata } from 'lib/metadata/fetch';
import { TokenMetadataNotFoundError } from 'lib/metadata/on-chain';
import { EvmCollectibleMetadata, EvmTokenMetadata } from 'lib/metadata/types';
import { loadContract } from 'lib/temple/contract';
import { useSafeState } from 'lib/ui/hooks';
import { delay } from 'lib/utils';
import { navigate } from 'lib/woozie';
import { UNDER_DEVELOPMENT_MSG } from 'temple/evm/under_dev_msg';
import { EvmChain, useAccountAddressForEvm, useAccountAddressForTezos } from 'temple/front';
import { validateTezosContractAddress } from 'temple/front/tezos';
import { TezosNetworkEssentials } from 'temple/networks';
import { getReadOnlyTezos } from 'temple/tezos';
import { TempleChainKind } from 'temple/types';

import { toExploreAssetLink } from '../Home/OtherComponents/Tokens/utils';

import { AddAssetSelectors } from './AddAsset.selectors';

const AddAsset = memo(() => {
  const accountTezosAddress = useAccountAddressForTezos();
  const accountEvmAddress = useAccountAddressForEvm();

  const chainSelectController = useChainSelectController();
  const network = chainSelectController.value;

  return (
    <PageLayout pageTitle={<PageTitle Icon={AddIcon} title={t('addAsset')} />}>
      <>
        <ChainSelectSection controller={chainSelectController} />

        {accountTezosAddress && network.kind === 'tezos' ? (
          <Form accountPkh={accountTezosAddress} network={network} />
        ) : accountEvmAddress && network.kind === 'evm' ? (
          <EvmForm accountPkh={accountEvmAddress} network={network} />
        ) : (
          <div className="text-center">{UNDER_DEVELOPMENT_MSG}</div>
        )}
      </>
    </PageLayout>
  );
});

export default AddAsset;

interface EvmFormProps {
  accountPkh: HexString;
  network: EvmChain;
}

interface EvmFormData {
  address: string;
  id?: string;
}

const EvmForm = memo<EvmFormProps>(({ accountPkh, network }) => {
  const { chainId } = network;

  const { register, handleSubmit, formState } = useForm<EvmFormData>({
    mode: 'onChange'
  });

  const onSubmit = useCallback(
    async ({ address, id }: EvmFormData) => {
      if (formState.isSubmitting) return;

      try {
        const assetSlug = toTokenSlug(address, id);

        const metadata = await fetchEvmAssetMetadataFromChain(network, assetSlug);

        if (!metadata) {
          console.error('Failed to load asset metadata');

          return;
        }

        const isToken = metadata.standard === EvmAssetStandard.ERC20;

        if (isToken) {
          dispatch(putNewEvmTokenAction({ publicKeyHash: accountPkh, chainId, assetSlug }));
          dispatch(putEvmTokensMetadataAction({ chainId, records: { [assetSlug]: metadata as EvmTokenMetadata } }));
        } else {
          dispatch(putNewEvmCollectibleAction({ publicKeyHash: accountPkh, chainId, assetSlug }));
          dispatch(
            putEvmCollectiblesMetadataAction({ chainId, records: { [assetSlug]: metadata as EvmCollectibleMetadata } })
          );
        }

        navigate({
          pathname: toExploreAssetLink(TempleChainKind.EVM, chainId, assetSlug)
        });
      } catch (err: any) {
        console.error(err);
      }
    },
    [formState.isSubmitting, network, accountPkh]
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <NoSpaceField
        ref={register({
          required: t('required')
        })}
        name="address"
        id="addtoken-address"
        textarea
        rows={2}
        label={t('address')}
        labelDescription={t('addressOfDeployedTokenContract')}
        placeholder="0x915a2..."
        containerClassName="mb-6"
        testIDs={{
          inputSection: AddAssetSelectors.addressInputSection,
          input: AddAssetSelectors.addressInput
        }}
      />

      <FormField
        ref={register()}
        min={0}
        type="text"
        name="id"
        id="token-id"
        label={`${t('assetId')} ${t('optionalComment')}`}
        labelDescription="A non-negative integer number that identifies the asset inside contract"
        placeholder="0"
        containerClassName="mb-6"
        testID={AddAssetSelectors.assetIDInput}
      />

      <FormSubmitButton loading={formState.isSubmitting} testID={AddAssetSelectors.addAssetButton}>
        <T id="addToken" />
      </FormSubmitButton>
    </form>
  );
});

interface FormData {
  address: string;
  id?: number;
  symbol: string;
  name: string;
  decimals: number;
  thumbnailUri: string;
}

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

interface FormProps {
  accountPkh: string;
  network: TezosNetworkEssentials;
}

const Form = memo<FormProps>(({ accountPkh, network }) => {
  const { rpcBaseURL, chainId } = network;

  const formAnalytics = useFormAnalytics('AddAsset');

  const { register, handleSubmit, errors, formState, watch, setValue, triggerValidation, clearError } =
    useForm<FormData>({
      mode: 'onChange'
    });

  const contractAddress = watch('address');
  const tokenId = watch('id') || 0;

  const formValid = useMemo(
    () => validateTezosContractAddress(contractAddress) === true && tokenId >= 0,
    [contractAddress, tokenId]
  );

  const [{ processing, bottomSectionVisible, tokenValidationError, tokenDataError }, setState] =
    useSafeState(INITIAL_STATE);
  const [submitError, setSubmitError] = useSafeState<ReactNode>(null);

  const attemptRef = useRef(0);
  const metadataRef = useRef<TokenMetadataResponse>();

  const loadMetadataPure = useCallback(async () => {
    if (!formValid) return;

    const attempt = ++attemptRef.current;
    setState({
      ...INITIAL_STATE,
      processing: true
    });

    let stateToSet: Partial<ComponentState>;

    try {
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
        metadataRef.current = metadata;

        setValue([
          { symbol: metadata.symbol },
          { name: metadata.name },
          { decimals: metadata.decimals },
          { thumbnailUri: metadata.thumbnailUri }
        ]);
      }

      stateToSet = {
        bottomSectionVisible: true
      };
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
  }, [rpcBaseURL, setValue, setState, formValid, contractAddress, tokenId]);

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
  }, [setState, formValid, rpcBaseURL, contractAddress, tokenId]);

  const cleanContractAddress = useCallback(() => {
    setValue('address', '');
    triggerValidation('address');
  }, [setValue, triggerValidation]);

  const onSubmit = useCallback(
    async ({ address, symbol, name, decimals, thumbnailUri, id }: FormData) => {
      if (formState.isSubmitting) return;

      setSubmitError(null);

      formAnalytics.trackSubmit();
      try {
        const tokenSlug = toTokenSlug(address, id || 0);

        const baseMetadata = {
          ...metadataRef.current,
          symbol,
          name,
          decimals: decimals ? +decimals : 0,
          thumbnailUri
        };
        const tokenMetadata: TokenMetadata = {
          ...baseMetadata,
          address: contractAddress,
          id: String(tokenId)
        };

        const assetIsCollectible = isCollectible(tokenMetadata);

        const actionPayload = { records: { [tokenSlug]: tokenMetadata } };
        if (assetIsCollectible) dispatch(putCollectiblesMetadataAction(actionPayload));
        else dispatch(putTokensMetadataAction(actionPayload));

        const asset = {
          chainId,
          account: accountPkh,
          slug: tokenSlug,
          status: 'enabled' as const
        };

        dispatch(assetIsCollectible ? putCollectiblesAsIsAction([asset]) : putTokensAsIsAction([asset]));

        formAnalytics.trackSubmitSuccess();

        navigate({
          pathname: toExploreAssetLink(TempleChainKind.Tezos, chainId, tokenSlug),
          search: 'after_token_added=true'
        });
      } catch (err: any) {
        console.error(err);

        formAnalytics.trackSubmitFail();

        setSubmitError(err.message);
      }
    },
    [formState.isSubmitting, chainId, accountPkh, setSubmitError, formAnalytics, contractAddress, tokenId]
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <NoSpaceField
        ref={register({
          required: t('required'),
          validate: validateTezosContractAddress
        })}
        name="address"
        id="addtoken-address"
        textarea
        rows={2}
        cleanable={Boolean(contractAddress)}
        onClean={cleanContractAddress}
        label={t('address')}
        labelDescription={t('addressOfDeployedTokenContract')}
        placeholder={t('tokenContractPlaceholder')}
        errorCaption={errors.address?.message}
        containerClassName="mb-6"
        testIDs={{
          inputSection: AddAssetSelectors.addressInputSection,
          input: AddAssetSelectors.addressInput
        }}
      />

      <FormField
        ref={register({
          min: { value: 0, message: t('nonNegativeIntMessage') }
        })}
        min={0}
        type="number"
        name="id"
        id="token-id"
        label={`${t('assetId')} ${t('optionalComment')}`}
        labelDescription={t('tokenIdInputDescription')}
        placeholder="0"
        errorCaption={errors.id?.message}
        containerClassName="mb-6"
        testID={AddAssetSelectors.assetIDInput}
      />

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
        className={classNames('w-full', {
          hidden: !bottomSectionVisible || processing
        })}
      >
        <BottomSection register={register} errors={errors} formState={formState} submitError={submitError} />
      </div>

      {processing && (
        <div className="my-8 w-full flex items-center justify-center pb-4">
          <div>
            <Spinner theme="gray" className="w-20" />
          </div>
        </div>
      )}
    </form>
  );
});

type BottomSectionProps = Pick<FormContextValues, 'register' | 'errors' | 'formState'> & {
  submitError?: ReactNode;
};

const BottomSection: FC<BottomSectionProps> = props => {
  const { register, errors, formState, submitError } = props;

  return (
    <>
      <FormField
        ref={register({
          required: t('required'),
          pattern: {
            value: /^[a-zA-Z0-9]{2,10}$/,
            message: t('tokenSymbolPatternDescription')
          }
        })}
        name="symbol"
        id="addtoken-symbol"
        label={t('symbol')}
        labelDescription={t('tokenSymbolInputDescription')}
        placeholder={t('tokenSymbolInputPlaceholder')}
        errorCaption={errors.symbol?.message}
        containerClassName="mb-4"
        testIDs={{
          inputSection: AddAssetSelectors.symbolInputSection,
          input: AddAssetSelectors.symbolInput
        }}
      />

      <FormField
        ref={register({
          required: t('required'),
          pattern: {
            value: /^.{3,25}$/,
            message: t('tokenNamePatternDescription')
          }
        })}
        name="name"
        id="addtoken-name"
        label={t('name')}
        labelDescription={t('tokenNameInputDescription')}
        placeholder={t('tokenNameInputPlaceholder')}
        errorCaption={errors.name?.message}
        containerClassName="mb-4"
        testIDs={{
          inputSection: AddAssetSelectors.nameInputSection,
          input: AddAssetSelectors.nameInput
        }}
      />

      <FormField
        ref={register({
          min: { value: 0, message: t('nonNegativeIntMessage') }
        })}
        type="number"
        name="decimals"
        id="addtoken-decimals"
        label={t('decimals')}
        labelDescription={t('decimalsInputDescription')}
        placeholder="0"
        errorCaption={errors.decimals?.message}
        containerClassName="mb-4"
        testIDs={{
          inputSection: AddAssetSelectors.decimalsInputSection,
          input: AddAssetSelectors.decimalsInput
        }}
      />

      <FormField
        ref={register({
          validate: (val: string) => {
            if (!val) return true;
            if (val.match(/(https:\/\/.*)/i) || val.match(/(ipfs:\/\/.*)/i) || val.match(/(data:image\/.*)/i)) {
              return true;
            }

            return (
              <ul className="list-disc list-inside">
                <li>
                  <T id="validImageURL" />
                </li>
                <li>
                  <T id="onlyHTTPS" />
                </li>
                <li>
                  <T id="formatsAllowed" />
                </li>
                <li>
                  <T id="orIPFSImageURL" />
                </li>
              </ul>
            );
          }
        })}
        name="thumbnailUri"
        id="addtoken-thumbnailUri"
        label={
          <>
            <T id="iconURL" />{' '}
            <span className="text-sm font-light text-gray-600">
              <T id="optionalComment" />
            </span>
          </>
        }
        labelDescription={t('iconURLInputDescription')}
        placeholder="e.g. https://cdn.com/mytoken.png"
        errorCaption={errors.thumbnailUri?.message}
        containerClassName="mb-6"
        testIDs={{
          inputSection: AddAssetSelectors.iconURLInputSection,
          input: AddAssetSelectors.iconURLInput
        }}
      />

      {submitError && <Alert type="error" title={t('error')} autoFocus description={submitError} className="mb-6" />}

      <FormSubmitButton loading={formState.isSubmitting} testID={AddAssetSelectors.addAssetButton}>
        <T id="addToken" />
      </FormSubmitButton>
    </>
  );
};

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

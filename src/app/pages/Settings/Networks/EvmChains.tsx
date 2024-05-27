import React, { memo, useCallback, useMemo } from 'react';

import clsx from 'clsx';
import { useForm } from 'react-hook-form';

import { Checkbox, FormField, FormSubmitButton, Name, SubTitle } from 'app/atoms';
import { URL_PATTERN } from 'app/defaults';
import { EVM_CHAINS_SPECS_STORAGE_KEY } from 'lib/constants';
import { T, t } from 'lib/i18n';
import { useStorage } from 'lib/temple/front';
import { COLORS } from 'lib/ui/colors';
import { useConfirm } from 'lib/ui/dialog';
import { EMPTY_FROZEN_OBJ } from 'lib/utils';
import { EvmChainInfo, loadEvmChainInfo } from 'temple/evm';
import { EvmChain, getNetworkTitle, useAllEvmChains, useTempleNetworksActions } from 'temple/front';
import { ChainSpecs } from 'temple/front/chains';
import { EVM_DEFAULT_NETWORKS } from 'temple/networks';
import { TempleChainKind, TempleChainTitle } from 'temple/types';

import { RpcItem } from './RpcItem';

// import { NetworkSettingsSelectors } from './selectors'; // TODO: Set

interface NetworkFormData {
  name: string;
  rpcBaseURL: string;
}

const SUBMIT_ERROR_TYPE = 'submit-error';

export const EvmChainsSettings = memo(() => {
  const chainsRecord = useAllEvmChains();
  const { customEvmNetworks, addEvmNetwork, removeEvmNetwork } = useTempleNetworksActions();

  const confirm = useConfirm();

  const {
    register,
    reset: resetForm,
    handleSubmit,
    formState,
    clearError,
    setError,
    errors
  } = useForm<NetworkFormData>();
  const submitting = formState.isSubmitting;

  const onNetworkFormSubmit = useCallback(
    async ({ rpcBaseURL, name }: NetworkFormData) => {
      if (submitting) return;
      clearError();

      let chainInfo: EvmChainInfo;
      try {
        chainInfo = await loadEvmChainInfo(rpcBaseURL);
      } catch (error) {
        console.error(error);

        setError('rpcBaseURL', SUBMIT_ERROR_TYPE, t('invalidRpcCantGetChainId'));

        return;
      }

      try {
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];

        await addEvmNetwork({
          id: rpcBaseURL,
          chain: TempleChainKind.EVM,
          chainId: chainInfo.chainId,
          currency: chainInfo.currency,
          testnet: chainInfo.testnet,
          rpcBaseURL,
          name,
          color
        });

        resetForm();
      } catch (error: any) {
        console.error(error);

        setError('rpcBaseURL', SUBMIT_ERROR_TYPE, error.message);
      }
    },
    [submitting, addEvmNetwork, setError, resetForm, clearError]
  );

  const rpcURLIsUnique = useCallback(
    (url: string) => ![...EVM_DEFAULT_NETWORKS, ...customEvmNetworks].some(({ rpcBaseURL }) => rpcBaseURL === url),
    [customEvmNetworks]
  );

  const handleRemoveClick = useCallback(
    async (networkId: string) => {
      if (
        !(await confirm({
          title: t('actionConfirmation'),
          children: t('deleteNetworkConfirm')
        }))
      ) {
        return;
      }

      removeEvmNetwork(networkId).catch(async err => {
        console.error(err);

        setError('rpcBaseURL', SUBMIT_ERROR_TYPE, err.message);
      });
    },
    [removeEvmNetwork, setError, confirm]
  );

  return (
    <>
      <div className="flex flex-col mb-8">
        <h2 className="mb-4 leading-tight flex flex-col">
          <span className="text-base font-semibold text-gray-700">
            {/* <T id="currentNetworks" /> */}
            {TempleChainTitle[TempleChainKind.EVM]} <T id="networks" />
          </span>

          <span className="mt-1 text-xs font-light text-gray-600 max-w-9/10">
            <T id="deleteNetworkHint" />
          </span>
        </h2>

        <div className="flex flex-col gap-y-4">
          {Object.values(chainsRecord).map(chain => (
            <ChainItem key={chain.chainId} chain={chain} onRemoveClick={handleRemoveClick} />
          ))}
        </div>
      </div>

      <SubTitle>
        <T id="addNetwork" />
      </SubTitle>

      <form onSubmit={handleSubmit(onNetworkFormSubmit)}>
        <FormField
          ref={register({ required: t('required'), maxLength: 35 })}
          label={t('name')}
          id="name"
          name="name"
          placeholder={t('networkNamePlaceholder')}
          errorCaption={errors.name?.message}
          containerClassName="mb-4"
          maxLength={35}
          // testIDs={{
          //   input: NetworkSettingsSelectors.nameInput,
          //   inputSection: NetworkSettingsSelectors.nameInputSection
          // }}
        />

        <FormField
          ref={register({
            required: t('required'),
            pattern: {
              value: URL_PATTERN,
              message: t('mustBeValidURL')
            },
            validate: {
              unique: rpcURLIsUnique
            }
          })}
          label={t('rpcBaseURL')}
          id="rpc-base-url"
          name="rpcBaseURL"
          placeholder="http://localhost:8545"
          errorCaption={errors.rpcBaseURL?.message || (errors.rpcBaseURL?.type === 'unique' ? t('mustBeUnique') : '')}
          containerClassName="mb-4"
          // testIDs={{
          //   input: NetworkSettingsSelectors.RPCbaseURLinput,
          //   inputSection: NetworkSettingsSelectors.RPCbaseURLinputSection
          // }}
        />

        <FormSubmitButton
          loading={submitting}
          // testID={NetworkSettingsSelectors.addNetworkButton}
        >
          <T id="addNetwork" />
        </FormSubmitButton>
      </form>
    </>
  );
});

interface ChainItemProps {
  chain: EvmChain;
  onRemoveClick: SyncFn<string>;
}

const ChainItem = memo<ChainItemProps>(({ chain, onRemoveClick }) => {
  const {
    chainId,
    allRpcs: networks,
    rpc: { id: activeRpcId }
  } = chain;

  const enabled = !chain.disabled;

  const [evmChainsSpecs, setEvmChainsSpecs] = useStorage<OptionalRecord<ChainSpecs>>(
    EVM_CHAINS_SPECS_STORAGE_KEY,
    EMPTY_FROZEN_OBJ
  );

  const onRpcSelect = useCallback(
    (rpcId: string) => {
      const specs: ChainSpecs = { ...evmChainsSpecs[chainId], activeRpcId: rpcId };

      setEvmChainsSpecs({ ...evmChainsSpecs, [chainId]: specs });
    },
    [setEvmChainsSpecs, evmChainsSpecs, chainId]
  );

  const onToggleChain = useMemo(() => {
    if (chainId === 1) return undefined;

    return (toEnable: boolean) => {
      if (toEnable === enabled) return;

      const specs: ChainSpecs = { ...evmChainsSpecs[chainId], disabled: !toEnable };

      setEvmChainsSpecs({ ...evmChainsSpecs, [chainId]: specs });
    };
  }, [setEvmChainsSpecs, evmChainsSpecs, enabled, chainId]);

  const CheckboxWrapper = onToggleChain ? 'label' : 'div';

  const lastIndex = networks.length - 1;

  return (
    <div className="flex flex-col text-gray-700 text-sm leading-tight border rounded-lg overflow-hidden">
      <CheckboxWrapper className="flex items-center py-2 px-4 bg-gray-100 border-b border-gray-200">
        <div className="flex-1 flex flex-col">
          <Name className="mb-1 text-md font-medium leading-tight">{getNetworkTitle(chain)}</Name>

          <div className="text-xs text-gray-700 font-light flex items-center mb-1">
            Chain ID:<Name className="ml-1 font-normal">{chain.chainId}</Name>
          </div>
        </div>

        <Checkbox
          overrideClassNames={clsx('h-6 w-6 rounded-md', !onToggleChain && 'opacity-50')}
          checked={enabled}
          onChange={onToggleChain}
        />
      </CheckboxWrapper>

      <div className="flex flex-col">
        {networks.map((rpc, index) => (
          <RpcItem
            key={rpc.id}
            network={rpc}
            selected={rpc.id === activeRpcId}
            last={index === lastIndex}
            onSelect={onRpcSelect}
            onRemoveClick={rpc.default ? undefined : onRemoveClick}
          />
        ))}
      </div>
    </div>
  );
});

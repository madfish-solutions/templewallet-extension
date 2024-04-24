import React, { memo, useCallback, useMemo } from 'react';

import clsx from 'clsx';
import { useForm } from 'react-hook-form';

import { Checkbox, FormField, FormSubmitButton, Name, SubTitle } from 'app/atoms';
import { URL_PATTERN } from 'app/defaults';
import { TEZOS_CHAINS_SPECS_STORAGE_KEY } from 'lib/constants';
import { T, t } from 'lib/i18n';
import { useStorage } from 'lib/temple/front';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { COLORS } from 'lib/ui/colors';
import { useConfirm } from 'lib/ui/dialog';
import { EMPTY_FROZEN_OBJ } from 'lib/utils';
import { TezosChain, getNetworkTitle, useAllTezosChains, useTempleNetworksActions } from 'temple/front';
import { TezosChainSpecs } from 'temple/front/chains';
import { TEZOS_DEFAULT_NETWORKS } from 'temple/networks';
import { loadTezosChainId } from 'temple/tezos';
import { TempleChainKind, TempleChainTitle } from 'temple/types';

import BlockExplorerSelect from './BlockExplorerSelect';
import { RpcItem } from './RpcItem';
import { NetworkSettingsSelectors } from './selectors';

interface NetworkFormData {
  name: string;
  rpcBaseURL: string;
}

const SUBMIT_ERROR_TYPE = 'submit-error';

export const TezosChainsSettings = memo(() => {
  const chainsRecord = useAllTezosChains();
  const { customTezosNetworks, addTezosNetwork, removeTezosNetwork } = useTempleNetworksActions();

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

  const confirm = useConfirm();

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

      removeTezosNetwork(networkId).catch(async err => {
        console.error(err);

        setError('rpcBaseURL', SUBMIT_ERROR_TYPE, err.message);
      });
    },
    [removeTezosNetwork, setError, confirm]
  );

  const onNetworkFormSubmit = useCallback(
    async ({ rpcBaseURL, name }: NetworkFormData) => {
      if (submitting) return;
      clearError();

      let chainId;
      try {
        chainId = await loadTezosChainId(rpcBaseURL);
      } catch (error) {
        console.error(error);

        setError('rpcBaseURL', SUBMIT_ERROR_TYPE, t('invalidRpcCantGetChainId'));

        return;
      }

      try {
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];

        await addTezosNetwork({
          id: rpcBaseURL,
          chain: TempleChainKind.Tezos,
          chainId,
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
    [submitting, addTezosNetwork, setError, resetForm, clearError]
  );

  const rpcURLIsUnique = useCallback(
    (url: string) => ![...TEZOS_DEFAULT_NETWORKS, ...customTezosNetworks].some(({ rpcBaseURL }) => rpcBaseURL === url),
    [customTezosNetworks]
  );

  return (
    <>
      <div className="flex flex-col mb-8">
        <h2 className="mb-4 leading-tight flex flex-col">
          <span className="text-base font-semibold text-gray-700">
            {/* <T id="currentNetworks" /> */}
            {TempleChainTitle[TempleChainKind.Tezos]} <T id="networks" />
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
          testIDs={{
            input: NetworkSettingsSelectors.nameInput,
            inputSection: NetworkSettingsSelectors.nameInputSection
          }}
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
          testIDs={{
            input: NetworkSettingsSelectors.RPCbaseURLinput,
            inputSection: NetworkSettingsSelectors.RPCbaseURLinputSection
          }}
        />

        <FormSubmitButton loading={submitting} testID={NetworkSettingsSelectors.addNetworkButton}>
          <T id="addNetwork" />
        </FormSubmitButton>
      </form>
    </>
  );
});

interface ChainItemProps {
  chain: TezosChain;
  onRemoveClick: SyncFn<string>;
}

const ChainItem = memo<ChainItemProps>(({ chain, onRemoveClick }) => {
  const {
    chainId,
    allRpcs: networks,
    rpc: { id: activeRpcId }
  } = chain;

  const enabled = !chain.disabled;

  const [tezosChainsSpecs, setTezosChainsSpecs] = useStorage<OptionalRecord<TezosChainSpecs>>(
    TEZOS_CHAINS_SPECS_STORAGE_KEY,
    EMPTY_FROZEN_OBJ
  );

  const onRpcSelect = useCallback(
    (rpcId: string) => {
      const specs: TezosChainSpecs = { ...tezosChainsSpecs[chainId], activeRpcId: rpcId };

      setTezosChainsSpecs({ ...tezosChainsSpecs, [chainId]: specs });
    },
    [setTezosChainsSpecs, tezosChainsSpecs, chainId]
  );

  const onToggleChain = useMemo(() => {
    if (chainId === TEZOS_MAINNET_CHAIN_ID) return undefined;

    return (toEnable: boolean) => {
      if (toEnable === enabled) return;

      const specs: TezosChainSpecs = { ...tezosChainsSpecs[chainId], disabled: !toEnable };

      setTezosChainsSpecs({ ...tezosChainsSpecs, [chainId]: specs });
    };
  }, [setTezosChainsSpecs, tezosChainsSpecs, enabled, chainId]);

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

      <div className="py-2 px-4 bg-gray-100 border-t border-gray-200">
        <BlockExplorerSelect tezosChainId={chain.chainId} />
      </div>
    </div>
  );
});

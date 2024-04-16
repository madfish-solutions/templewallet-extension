import React, { memo, useCallback } from 'react';

import { useForm } from 'react-hook-form';

import { FormField, FormSubmitButton, SubTitle } from 'app/atoms';
import { URL_PATTERN } from 'app/defaults';
import { T, t } from 'lib/i18n';
import { COLORS } from 'lib/ui/colors';
import { useConfirm } from 'lib/ui/dialog';
import { useTempleNetworksActions } from 'temple/front';
import { TEZOS_DEFAULT_NETWORKS } from 'temple/networks';
import { loadTezosChainId } from 'temple/tezos';
import { TempleChainKind } from 'temple/types';

import { NetworksList } from './NetworksList';
import { NetworkSettingsSelectors } from './selectors';

interface NetworkFormData {
  name: string;
  rpcBaseURL: string;
}

const SUBMIT_ERROR_TYPE = 'submit-error';

export const TezosNetworksSettings = memo(() => {
  const { customTezosNetworks, addTezosNetwork, removeTezosNetwork } = useTempleNetworksActions();

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

  return (
    <div className="w-full max-w-sm mt-6 p-2 pb-4 mx-auto">
      <NetworksList
        chain={TempleChainKind.Tezos}
        customNetworks={customTezosNetworks}
        defaultNetworks={TEZOS_DEFAULT_NETWORKS}
        handleRemoveClick={handleRemoveClick}
      />

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
    </div>
  );
});

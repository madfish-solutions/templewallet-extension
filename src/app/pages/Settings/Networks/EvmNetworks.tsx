import React, { memo, useCallback } from 'react';

import { useForm } from 'react-hook-form';

import { FormField, FormSubmitButton, SubTitle } from 'app/atoms';
import { URL_PATTERN } from 'app/defaults';
import { T, t } from 'lib/i18n';
import { COLORS } from 'lib/ui/colors';
import { useConfirm } from 'lib/ui/dialog';
import { loadEvmChainInfo } from 'temple/evm';
import { useTempleNetworksActions } from 'temple/front';
import { DEFAULT_EVM_NETWORKS, EvmNativeCurrency } from 'temple/networks';
import { TempleChainName } from 'temple/types';

import { NetworksList } from './NetworksList';
// import { NetworkSettingsSelectors } from './selectors';

interface NetworkFormData {
  name: string;
  rpcBaseURL: string;
}

const SUBMIT_ERROR_TYPE = 'submit-error';

export const EvmNetworksSettings = memo(() => {
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

      let chainId: number, currency: EvmNativeCurrency;
      try {
        const info = await loadEvmChainInfo(rpcBaseURL);
        console.log('INFO:', info);
        chainId = info.chainId;
        currency = info.currency;
      } catch (error) {
        console.error(error);

        setError('rpcBaseURL', SUBMIT_ERROR_TYPE, t('invalidRpcCantGetChainId'));

        return;
      }

      try {
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];

        await addEvmNetwork({
          id: rpcBaseURL,
          chainId,
          rpcBaseURL,
          name,
          currency,
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
    (url: string) => ![...DEFAULT_EVM_NETWORKS, ...customEvmNetworks].some(({ rpcBaseURL }) => rpcBaseURL === url),
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
    <div className="w-full max-w-sm mt-6 p-2 pb-4 mx-auto">
      <NetworksList
        chain={TempleChainName.EVM}
        customNetworks={customEvmNetworks}
        defaultNetworks={DEFAULT_EVM_NETWORKS}
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
    </div>
  );
});

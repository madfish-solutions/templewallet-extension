import React, { FC, useCallback, useMemo } from 'react';

import classNames from 'clsx';
import { useForm } from 'react-hook-form';

import { FormField, FormSubmitButton } from 'app/atoms';
import Name from 'app/atoms/Name';
import SubTitle from 'app/atoms/SubTitle';
import { URL_PATTERN } from 'app/defaults';
import { ReactComponent as CloseIcon } from 'app/icons/close.svg';
import { setAnotherSelector, setTestID } from 'lib/analytics';
import { T, t } from 'lib/i18n';
import { useSettings, useTempleClient } from 'lib/temple/front';
import { StoredNetwork } from 'lib/temple/types';
import { COLORS } from 'lib/ui/colors';
import { useConfirm } from 'lib/ui/dialog';
import { TEZOS_NETWORKS } from 'temple/networks';
import { loadTezosChainId } from 'temple/tezos';

import { CustomNetworkSettingsSelectors } from './CustomNetworkSettingsSelectors';

interface NetworkFormData {
  name: string;
  rpcBaseURL: string;
}

const SUBMIT_ERROR_TYPE = 'submit-error';

const CustomNetworksSettings: FC = () => {
  const { updateSettings } = useTempleClient();
  const { customNetworks = [] } = useSettings();
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

      // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
      // @ts-ignore
      let chainId;
      try {
        chainId = await loadTezosChainId(rpcBaseURL);
      } catch (err: any) {
        console.error(err);

        setError('rpcBaseURL', SUBMIT_ERROR_TYPE, t('invalidRpcCantGetChainId'));

        return;
      }

      try {
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];

        await updateSettings({
          customNetworks: [
            ...customNetworks,
            {
              // TODO: chainId
              rpcBaseURL,
              name,
              disabled: false,
              color,
              id: rpcBaseURL
            }
          ]
        });

        resetForm();
      } catch (err: any) {
        console.error(err);

        setError('rpcBaseURL', SUBMIT_ERROR_TYPE, err.message);
      }
    },
    [clearError, customNetworks, resetForm, submitting, setError, updateSettings]
  );

  const rpcURLIsUnique = useCallback(
    (url: string) => ![...TEZOS_NETWORKS, ...customNetworks].some(({ rpcBaseURL }) => rpcBaseURL === url),
    [customNetworks]
  );

  const handleRemoveClick = useCallback(
    async (baseUrl: string) => {
      if (
        !(await confirm({
          title: t('actionConfirmation'),
          children: t('deleteNetworkConfirm')
        }))
      ) {
        return;
      }

      updateSettings({
        customNetworks: customNetworks.filter(({ rpcBaseURL }) => rpcBaseURL !== baseUrl)
      }).catch(async err => {
        console.error(err);

        setError('rpcBaseURL', SUBMIT_ERROR_TYPE, err.message);
      });
    },
    [customNetworks, setError, updateSettings, confirm]
  );

  return (
    <div className="w-full max-w-sm p-2 pb-4 mx-auto">
      <div className="flex flex-col mb-8">
        <h2 className="mb-4 leading-tight flex flex-col">
          <span className="text-base font-semibold text-gray-700">
            <T id="currentNetworks" />
          </span>

          <span className="mt-1 text-xs font-light text-gray-600 max-w-9/10">
            <T id="deleteNetworkHint" />
          </span>
        </h2>

        <div className="flex flex-col text-gray-700 text-sm leading-tight border rounded-md overflow-hidden">
          {customNetworks.map(network => (
            <NetworksListItem
              network={network}
              last={false}
              key={network.rpcBaseURL}
              onRemoveClick={handleRemoveClick}
            />
          ))}
          {TEZOS_NETWORKS.map((network, index) => (
            <NetworksListItem key={network.rpcBaseURL} last={index === TEZOS_NETWORKS.length - 1} network={network} />
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
            input: CustomNetworkSettingsSelectors.nameInput,
            inputSection: CustomNetworkSettingsSelectors.nameInputSection
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
            input: CustomNetworkSettingsSelectors.RPCbaseURLinput,
            inputSection: CustomNetworkSettingsSelectors.RPCbaseURLinputSection
          }}
        />

        <FormSubmitButton loading={submitting} testID={CustomNetworkSettingsSelectors.addNetworkButton}>
          <T id="addNetwork" />
        </FormSubmitButton>
      </form>
    </div>
  );
};

export default CustomNetworksSettings;

type NetworksListItemProps = {
  network: StoredNetwork;
  onRemoveClick?: (baseUrl: string) => void;
  last: boolean;
};

const NetworksListItem: FC<NetworksListItemProps> = props => {
  const {
    network: { name, nameI18nKey, rpcBaseURL, color },
    onRemoveClick,
    last
  } = props;

  const handleRemoveClick = useMemo(() => {
    if (!onRemoveClick) return null;

    return () => onRemoveClick(rpcBaseURL);
  }, [onRemoveClick, rpcBaseURL]);

  return (
    <div
      className={classNames(
        'flex items-stretch block w-full overflow-hidden text-gray-700',
        !last && 'border-b border-gray-200',
        'opacity-90 hover:opacity-100 focus:outline-none',
        'transition ease-in-out duration-200'
      )}
      style={{
        padding: '0.4rem 0.375rem 0.4rem 0.375rem'
      }}
      {...setTestID(CustomNetworkSettingsSelectors.networkItem)}
      {...setAnotherSelector('url', rpcBaseURL)}
    >
      <div
        className="mt-1 ml-2 mr-3 w-3 h-3 border border-primary-white rounded-full shadow-xs"
        style={{ background: color }}
      />

      <div className="flex flex-col justify-between flex-1">
        <Name className="mb-1 text-sm font-medium leading-tight">
          {(nameI18nKey && <T id={nameI18nKey} />) || name}
        </Name>

        <div
          className="text-xs text-gray-700 font-light flex items-center"
          style={{
            marginBottom: '0.125rem'
          }}
        >
          RPC:<Name className="ml-1 font-normal">{rpcBaseURL}</Name>
        </div>
      </div>

      {handleRemoveClick && (
        <button
          className="flex-none p-2 text-gray-500 hover:text-gray-600 transition ease-in-out duration-200"
          onClick={handleRemoveClick}
          {...setTestID(CustomNetworkSettingsSelectors.deleteCustomNetworkButton)}
          {...setAnotherSelector('url', rpcBaseURL)}
        >
          <CloseIcon className="w-auto h-5 stroke-current stroke-2" title={t('delete')} />
        </button>
      )}
    </div>
  );
};

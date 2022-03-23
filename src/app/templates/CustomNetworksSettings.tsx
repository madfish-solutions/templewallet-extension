import React, { FC, useCallback } from 'react';

import classNames from 'clsx';
import { useForm } from 'react-hook-form';

import FormField from 'app/atoms/FormField';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import Name from 'app/atoms/Name';
import SubTitle from 'app/atoms/SubTitle';
import { URL_PATTERN } from 'app/defaults';
import { ReactComponent as CloseIcon } from 'app/icons/close.svg';
import { T, t } from 'lib/i18n/react';
import { loadChainId, NETWORK_IDS, TempleNetwork, useSettings, useTempleClient } from 'lib/temple/front';
import { COLORS } from 'lib/ui/colors';
import { useConfirm } from 'lib/ui/dialog';
import { withErrorHumanDelay } from 'lib/ui/humanDelay';

type NetworkFormData = Pick<TempleNetwork, 'name' | 'rpcBaseURL'>;

const SUBMIT_ERROR_TYPE = 'submit-error';

const CustomNetworksSettings: FC = () => {
  const { updateSettings, defaultNetworks } = useTempleClient();
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

      let chainId;
      try {
        chainId = await loadChainId(rpcBaseURL);
      } catch (err: any) {
        await withErrorHumanDelay(err, () => setError('rpcBaseURL', SUBMIT_ERROR_TYPE, t('invalidRpcCantGetChainId')));
        return;
      }

      try {
        const networkId = NETWORK_IDS.get(chainId) ?? rpcBaseURL;
        await updateSettings({
          customNetworks: [
            ...customNetworks,
            {
              rpcBaseURL,
              name,
              description: name,
              type: networkId === 'mainnet' ? 'main' : 'test',
              disabled: false,
              color: COLORS[Math.floor(Math.random() * COLORS.length)],
              id: rpcBaseURL
            }
          ]
        });
        resetForm();
      } catch (err: any) {
        await withErrorHumanDelay(err, () => setError('rpcBaseURL', SUBMIT_ERROR_TYPE, err.message));
      }
    },
    [clearError, customNetworks, resetForm, submitting, setError, updateSettings]
  );

  const rpcURLIsUnique = useCallback(
    (url: string) =>
      ![...defaultNetworks, ...customNetworks].filter(n => !n.hidden).some(({ rpcBaseURL }) => rpcBaseURL === url),
    [customNetworks, defaultNetworks]
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
        await new Promise(res => setTimeout(res, 300));
        setError('rpcBaseURL', SUBMIT_ERROR_TYPE, err.message);
      });
    },
    [customNetworks, setError, updateSettings, confirm]
  );

  return (
    <div className="w-full max-w-sm p-2 pb-4 mx-auto">
      <div className="flex flex-col mb-8">
        <h2 className={classNames('mb-4', 'leading-tight', 'flex flex-col')}>
          <T id="currentNetworks">
            {message => <span className="text-base font-semibold text-gray-700">{message}</span>}
          </T>

          <T id="deleteNetworkHint">
            {message => (
              <span className={classNames('mt-1', 'text-xs font-light text-gray-600')} style={{ maxWidth: '90%' }}>
                {message}
              </span>
            )}
          </T>
        </h2>

        <div
          className={classNames(
            'rounded-md overflow-hidden',
            'border',
            'flex flex-col',
            'text-gray-700 text-sm leading-tight'
          )}
        >
          {customNetworks.map(network => (
            <NetworksListItem
              canRemove
              network={network}
              last={false}
              key={network.rpcBaseURL}
              onRemoveClick={handleRemoveClick}
            />
          ))}
          {defaultNetworks
            .filter(n => !n.hidden)
            .map((network, index) => (
              <NetworksListItem
                canRemove={false}
                key={network.rpcBaseURL}
                last={index === defaultNetworks.length - 1}
                network={network}
              />
            ))}
        </div>
      </div>

      <SubTitle>
        <T id="AddNetwork" />
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
        />

        <T id="addNetwork">{message => <FormSubmitButton loading={submitting}>{message}</FormSubmitButton>}</T>
      </form>
    </div>
  );
};

export default CustomNetworksSettings;

type NetworksListItemProps = {
  canRemove: boolean;
  network: TempleNetwork;
  onRemoveClick?: (baseUrl: string) => void;
  last: boolean;
};

const NetworksListItem: FC<NetworksListItemProps> = props => {
  const {
    network: { name, nameI18nKey, rpcBaseURL, color },
    canRemove,
    onRemoveClick,
    last
  } = props;
  const handleRemoveClick = useCallback(() => onRemoveClick?.(rpcBaseURL), [onRemoveClick, rpcBaseURL]);

  return (
    <div
      className={classNames(
        'block w-full',
        'overflow-hidden',
        !last && 'border-b border-gray-200',
        'flex items-stretch',
        'text-gray-700',
        'transition ease-in-out duration-200',
        'focus:outline-none',
        'opacity-90 hover:opacity-100'
      )}
      style={{
        padding: '0.4rem 0.375rem 0.4rem 0.375rem'
      }}
    >
      <div
        className={classNames('mt-1 ml-2 mr-3', 'w-3 h-3', 'border border-primary-white', 'rounded-full shadow-xs')}
        style={{ background: color }}
      />

      <div className="flex flex-col justify-between flex-1">
        <Name className="mb-1 text-sm font-medium leading-tight">
          {(nameI18nKey && <T id={nameI18nKey} />) || name}
        </Name>

        <div
          className={classNames('text-xs text-gray-700 font-light', 'flex items-center')}
          style={{
            marginBottom: '0.125rem'
          }}
        >
          RPC:<Name className="ml-1 font-normal">{rpcBaseURL}</Name>
        </div>
      </div>

      {canRemove && (
        <button
          className={classNames(
            'flex-none p-2',
            'text-gray-500 hover:text-gray-600',
            'transition ease-in-out duration-200'
          )}
          onClick={handleRemoveClick}
        >
          <CloseIcon className="w-auto h-5 stroke-current stroke-2" title={t('delete')} />
        </button>
      )}
    </div>
  );
};

import React, { memo, KeyboardEventHandler, ReactNode, useCallback, useMemo } from 'react';

import { useForm } from 'react-hook-form';

import { Alert, Divider, FormField, FormSubmitButton } from 'app/atoms';
import AccountBanner from 'app/templates/AccountBanner';
import { T, t } from 'lib/i18n';
import { useSafeState } from 'lib/ui/hooks';
import { AccountForTezos } from 'temple/accounts';
import { UNDER_DEVELOPMENT_MSG } from 'temple/evm/under_dev_msg';
import { useAccountForTezos } from 'temple/front';
import { TezosNetworkEssentials } from 'temple/networks';
import { getReadOnlyTezos, confirmTezosOperation } from 'temple/tezos';
import { activateTezosAccount } from 'temple/tezos/activate-account';

import { ChainSelect, useChainSelectController } from '../ChainSelect';

import { ActivateAccountSelectors } from './ActivateAccount.selectors';

interface FormData {
  secret: string;
}

const SUBMIT_ERROR_TYPE = 'submit-error';

const ActivateAccount = memo(() => {
  const account = useAccountForTezos();
  const chainSelectController = useChainSelectController();
  const network = chainSelectController.value;

  return (
    <>
      <div className="w-full max-w-sm mx-auto my-8">
        <div className="flex">
          <span className="text-xl text-gray-900">
            <T id="network" />:
          </span>
          <div className="flex-1" />
          <ChainSelect controller={chainSelectController} />
        </div>

        <Divider className="mt-4 mb-8" />
      </div>

      {account && network.chain === 'tezos' ? (
        <ActivateTezosAccount network={network} account={account} />
      ) : (
        <div className="text-center">{UNDER_DEVELOPMENT_MSG}</div>
      )}
    </>
  );
});

interface Props {
  network: TezosNetworkEssentials;
  account: AccountForTezos;
}

const ActivateTezosAccount = memo<Props>(({ network, account }) => {
  const [success, setSuccess] = useSafeState<ReactNode>(null);

  const { register, handleSubmit, formState, clearError, setError, errors } = useForm<FormData>();
  const submitting = formState.isSubmitting;

  const rpcUrl = network.rpcBaseURL;

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (submitting) return;

      clearError('secret');
      setSuccess(null);

      try {
        const tezos = getReadOnlyTezos(rpcUrl);

        const activation = await activateTezosAccount(account.address, data.secret.replace(/\s/g, ''), tezos);
        switch (activation.status) {
          case 'ALREADY_ACTIVATED':
            setSuccess(`🏁 ${t('accountAlreadyActivated')}`);
            break;

          case 'SENT':
            setSuccess(`🛫 ${t('requestSent', t('activationOperationType'))}`);
            confirmTezosOperation(tezos, activation.operation.hash).then(() => {
              setSuccess(`✅ ${t('accountActivated')}`);
            });
            break;
        }
      } catch (err: any) {
        console.error(err);

        const mes = t('failureSecretMayBeInvalid');
        setError('secret', SUBMIT_ERROR_TYPE, mes);
      }
    },
    [clearError, submitting, setError, setSuccess, account.address, rpcUrl]
  );

  const submit = useMemo(() => handleSubmit(onSubmit), [handleSubmit, onSubmit]);

  const handleSecretFieldKeyPress = useCallback<KeyboardEventHandler>(
    evt => {
      if (evt.which === 13 && !evt.shiftKey) {
        evt.preventDefault();
        submit();
      }
    },
    [submit]
  );

  return (
    <form className="w-full max-w-sm p-2 mx-auto" onSubmit={submit}>
      <AccountBanner
        tezosNetwork={network}
        account={account}
        labelDescription={
          <>
            <T id="accountToBeActivated" />
            <br />
            <T id="ifYouWantToActivateAnotherAccount" />
          </>
        }
        className="mb-6"
      />

      {success && <Alert type="success" title={t('success')} description={success} autoFocus className="mb-4" />}

      <FormField
        textarea
        rows={2}
        ref={register({ required: t('required') })}
        name="secret"
        id="activateaccount-secret"
        label={t('activateAccountSecret')}
        labelDescription={t('activateAccountSecretDescription')}
        placeholder={t('activateAccountSecretPlaceholder')}
        errorCaption={errors.secret?.message}
        style={{ resize: 'none' }}
        containerClassName="mb-4"
        onKeyPress={handleSecretFieldKeyPress}
        testID={ActivateAccountSelectors.secretInput}
      />

      <FormSubmitButton
        loading={submitting}
        testID={ActivateAccountSelectors.activateButton}
        testIDProperties={{ accountTypeEnum: account.type }}
      >
        <T id="activate" />
      </FormSubmitButton>
    </form>
  );
});

export default ActivateAccount;

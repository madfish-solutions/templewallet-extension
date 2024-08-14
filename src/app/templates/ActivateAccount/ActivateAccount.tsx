import React, { memo, KeyboardEventHandler, ReactNode, useCallback, useMemo } from 'react';

import { useForm } from 'react-hook-form';

import { Alert, FormField, FormSubmitButton } from 'app/atoms';
import AccountBanner from 'app/templates/AccountBanner';
import { T, t } from 'lib/i18n';
import { useSafeState } from 'lib/ui/hooks';
import { AccountForTezos } from 'temple/accounts';
import { UNDER_DEVELOPMENT_MSG } from 'temple/evm/under_dev_msg';
import { useAccountForTezos } from 'temple/front';
import { TezosNetworkEssentials } from 'temple/networks';
import { getReadOnlyTezos, confirmTezosOperation } from 'temple/tezos';
import { activateTezosAccount } from 'temple/tezos/activate-account';

import { ChainSelectSection, useChainSelectController } from '../ChainSelect';

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
      <ChainSelectSection controller={chainSelectController} />

      {account && network.kind === 'tezos' ? (
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
    <form className="p-2" onSubmit={submit}>
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

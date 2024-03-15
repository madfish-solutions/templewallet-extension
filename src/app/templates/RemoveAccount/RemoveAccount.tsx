import React, { FC, useCallback, useEffect, useRef } from 'react';

import { OnSubmit, useForm } from 'react-hook-form';

import { Alert, FormField, FormSubmitButton } from 'app/atoms';
import AccountBanner from 'app/templates/AccountBanner';
import { T, t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import { TempleAccountType } from 'lib/temple/types';
import { delay } from 'lib/utils';
import { navigate } from 'lib/woozie';
import { useAccount, useTezosNetwork, useTezosRelevantAccounts } from 'temple/front';

import { RemoveAccountSelectors } from './RemoveAccount.selectors';

const SUBMIT_ERROR_TYPE = 'submit-error';

type FormData = {
  password: string;
};

const RemoveAccount: FC = () => {
  const { removeAccount } = useTempleClient();
  const { chainId } = useTezosNetwork();
  const allAccounts = useTezosRelevantAccounts(chainId);
  const account = useAccount();

  const prevAccLengthRef = useRef(allAccounts.length);
  useEffect(() => {
    const accLength = allAccounts.length;
    if (prevAccLengthRef.current > accLength) {
      navigate('/');
    }
    prevAccLengthRef.current = accLength;
  }, [allAccounts]);

  const { register, handleSubmit, errors, setError, clearError, formState } = useForm<FormData>();
  const submitting = formState.isSubmitting;

  const onSubmit = useCallback<OnSubmit<FormData>>(
    async ({ password }) => {
      if (submitting) return;

      clearError('password');
      try {
        await removeAccount(account.publicKeyHash, password);
      } catch (err: any) {
        console.error(err);

        // Human delay.
        await delay();
        setError('password', SUBMIT_ERROR_TYPE, err.message);
      }
    },
    [submitting, clearError, setError, removeAccount, account.publicKeyHash]
  );

  return (
    <div className="w-full max-w-sm p-2 mx-auto">
      <AccountBanner
        account={account}
        labelDescription={
          <>
            <T id="accountToBeRemoved" />
            <br />
            <T id="ifYouWantToRemoveAnotherAccount" />
          </>
        }
        className="mb-6"
      />

      {account.type === TempleAccountType.HD ? (
        <Alert
          title={t('cannotBeRemoved')}
          description={
            <p>
              <T id="accountsToRemoveConstraint" />
            </p>
          }
          className="my-4"
        />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormField
            ref={register({ required: t('required') })}
            label={t('password')}
            labelDescription={t('enterPasswordToRemoveAccount')}
            id="removeacc-secret-password"
            type="password"
            name="password"
            placeholder="********"
            errorCaption={errors.password?.message}
            containerClassName="mb-4"
            testID={RemoveAccountSelectors.passwordInput}
          />

          <FormSubmitButton
            loading={submitting}
            disabled={submitting}
            testID={RemoveAccountSelectors.removeButton}
            testIDProperties={{ accountTypeEnum: account.type }}
          >
            <T id="remove" />
          </FormSubmitButton>
        </form>
      )}
    </div>
  );
};

export default RemoveAccount;

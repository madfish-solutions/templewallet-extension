import React, { FC, useCallback, useEffect, useMemo, useRef } from 'react';

import { OnSubmit, useForm } from 'react-hook-form';

import { FormField, FormSubmitButton } from 'app/atoms';
import { ACCOUNT_NAME_PATTERN } from 'app/defaults';
import { ReactComponent as AddIcon } from 'app/icons/add.svg';
import PageLayout from 'app/layouts/PageLayout';
import { useFormAnalytics } from 'lib/analytics';
import { T, t } from 'lib/i18n';
import { useTempleClient, useAllAccounts, useSetAccountPkh } from 'lib/temple/front';
import { TempleAccountType } from 'lib/temple/types';
import { delay } from 'lib/utils';
import { navigate } from 'lib/woozie';

import { CreateAccountSelectors } from './CreateAccount.selectors';

type FormData = {
  name: string;
};

const SUBMIT_ERROR_TYPE = 'submit-error';

const CreateAccount: FC = () => {
  const { createAccount } = useTempleClient();
  const allAccounts = useAllAccounts();
  const setAccountPkh = useSetAccountPkh();
  const formAnalytics = useFormAnalytics('CreateAccount');

  const allHDOrImported = useMemo(
    () => allAccounts.filter(acc => [TempleAccountType.HD, TempleAccountType.Imported].includes(acc.type)),
    [allAccounts]
  );

  const defaultName = useMemo(
    () => t('defaultAccountName', String(allHDOrImported.length + 1)),
    [allHDOrImported.length]
  );

  const prevAccLengthRef = useRef(allAccounts.length);
  useEffect(() => {
    const accLength = allAccounts.length;
    if (prevAccLengthRef.current < accLength) {
      setAccountPkh(allAccounts[accLength - 1].publicKeyHash);
      navigate('/');
    }
    prevAccLengthRef.current = accLength;
  }, [allAccounts, setAccountPkh]);

  const { register, handleSubmit, errors, setError, clearError, formState } = useForm<FormData>({
    defaultValues: { name: defaultName }
  });
  const submitting = formState.isSubmitting;

  const onSubmit = useCallback<OnSubmit<FormData>>(
    async ({ name }) => {
      if (submitting) return;

      clearError('name');

      formAnalytics.trackSubmit();
      try {
        await createAccount(name);

        formAnalytics.trackSubmitSuccess();
      } catch (err: any) {
        formAnalytics.trackSubmitFail();

        console.error(err);

        // Human delay.
        await delay();
        setError('name', SUBMIT_ERROR_TYPE, err.message);
      }
    },
    [submitting, clearError, setError, createAccount, formAnalytics]
  );

  return (
    <PageLayout
      pageTitle={
        <>
          <AddIcon className="w-auto h-4 mr-1 stroke-current" />
          <T id="createAccount" />
        </>
      }
    >
      <div className="w-full max-w-sm mx-auto mt-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormField
            ref={register({
              pattern: {
                value: ACCOUNT_NAME_PATTERN,
                message: t('accountNameInputTitle')
              }
            })}
            label={t('accountName')}
            labelDescription={t('accountNameInputDescription')}
            id="create-account-name"
            type="text"
            name="name"
            placeholder={defaultName}
            errorCaption={errors.name?.message}
            containerClassName="mb-4"
            testID={CreateAccountSelectors.accountNameInputField}
          />

          <FormSubmitButton loading={submitting} testID={CreateAccountSelectors.createOrRestoreButton}>
            <T id="createAccount" />
          </FormSubmitButton>
        </form>
      </div>
    </PageLayout>
  );
};

export default CreateAccount;

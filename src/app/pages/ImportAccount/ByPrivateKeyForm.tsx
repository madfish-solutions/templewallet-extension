import React, { memo, ReactNode, useCallback, useMemo, useState } from 'react';

import { useForm } from 'react-hook-form';
import {
  isHex as isEvmPrivateKey // TODO: Allow no `0x` (or find other way to determine chain) - MetaMask reveals without it
} from 'viem/utils';

import { Alert, FormField, FormSubmitButton } from 'app/atoms';
import { useFormAnalytics } from 'lib/analytics';
import { T, t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import { clearClipboard } from 'lib/ui/utils';
import { TempleChainName } from 'temple/types';

import { ImportAccountSelectors, ImportAccountFormType } from './selectors';

interface ByPrivateKeyFormData {
  privateKey: string;
  encPassword?: string;
}

export const ByPrivateKeyForm = memo(() => {
  const { importAccount } = useTempleClient();
  const formAnalytics = useFormAnalytics(ImportAccountFormType.PrivateKey);

  const { register, handleSubmit, errors, formState, watch } = useForm<ByPrivateKeyFormData>();
  const [error, setError] = useState<ReactNode>(null);

  const onSubmit = useCallback(
    async ({ privateKey, encPassword }: ByPrivateKeyFormData) => {
      if (formState.isSubmitting) return;

      formAnalytics.trackSubmit();
      setError(null);
      let chain: TempleChainName | undefined;
      try {
        const finalPrivateKey = privateKey.replace(/\s/g, '');
        chain = isEvmPrivateKey(finalPrivateKey) ? TempleChainName.EVM : TempleChainName.Tezos;

        await importAccount(chain, finalPrivateKey, encPassword);

        formAnalytics.trackSubmitSuccess({ chain });
      } catch (err: any) {
        formAnalytics.trackSubmitFail({ chain });

        console.error(err);

        setError(err.message);
      }
    },
    [importAccount, formState.isSubmitting, setError, formAnalytics]
  );

  const keyValue = watch('privateKey');
  const encrypted = useMemo(() => !isEvmPrivateKey(keyValue) && keyValue?.substring(2, 3) === 'e', [keyValue]);

  return (
    <form className="w-full max-w-sm mx-auto my-8" onSubmit={handleSubmit(onSubmit)}>
      {error && <Alert type="error" title={t('error')} autoFocus description={error} className="mb-6" />}

      <FormField
        ref={register({ required: t('required') })}
        type="password"
        revealForbidden
        name="privateKey"
        id="importacc-privatekey"
        label={t('privateKey')}
        labelDescription={t('privateKeyInputDescription')}
        placeholder={t('privateKeyInputPlaceholder')}
        errorCaption={errors.privateKey?.message}
        className="resize-none"
        containerClassName="mb-6"
        onPaste={clearClipboard}
        testID={ImportAccountSelectors.privateKeyInput}
      />

      {encrypted && (
        <FormField
          ref={register}
          name="encPassword"
          type="password"
          id="importacc-password"
          label={
            <>
              <T id="password" />{' '}
              <span className="text-sm font-light text-gray-600">
                <T id="optionalComment" />
              </span>
            </>
          }
          labelDescription={t('isPrivateKeyEncrypted')}
          placeholder="*********"
          errorCaption={errors.encPassword?.message}
          containerClassName="mb-6"
        />
      )}

      <FormSubmitButton loading={formState.isSubmitting} testID={ImportAccountSelectors.privateKeyImportButton}>
        {t('importAccount')}
      </FormSubmitButton>
    </form>
  );
});

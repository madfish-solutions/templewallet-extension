import React, { FC, ReactNode, useCallback, useMemo, useRef, useState } from 'react';

import { useForm, Controller } from 'react-hook-form';

import { Alert, FormSubmitButton, NoSpaceField } from 'app/atoms';
import { useFormAnalytics } from 'lib/analytics';
import { T, t } from 'lib/i18n';
import { useTempleClient, useTezos, useTezosDomainsClient, validateDelegate } from 'lib/temple/front';
import { useTezosAddressByDomainName } from 'lib/temple/front/tzdns';
import { isAddressValid, isKTAddress } from 'lib/temple/helpers';

import { ImportAccountSelectors, ImportAccountFormType } from './selectors';

interface WatchOnlyFormData {
  address: string;
}

export const WatchOnlyForm: FC = () => {
  const { importWatchOnlyAccount } = useTempleClient();
  const tezos = useTezos();
  const domainsClient = useTezosDomainsClient();
  const canUseDomainNames = domainsClient.isSupported;
  const formAnalytics = useFormAnalytics(ImportAccountFormType.WatchOnly);

  const { watch, handleSubmit, errors, control, formState, setValue, triggerValidation } = useForm<WatchOnlyFormData>({
    mode: 'onChange'
  });
  const [error, setError] = useState<ReactNode>(null);

  const addressFieldRef = useRef<HTMLTextAreaElement>(null);

  const addressValue = watch('address');

  const { data: resolvedAddress } = useTezosAddressByDomainName(addressValue);

  const finalAddress = useMemo(
    () => (resolvedAddress && resolvedAddress !== null ? resolvedAddress : addressValue),
    [resolvedAddress, addressValue]
  );

  const cleanAddressField = useCallback(() => {
    setValue('address', '');
    triggerValidation('address');
  }, [setValue, triggerValidation]);

  const onSubmit = useCallback(async () => {
    if (formState.isSubmitting) return;

    setError(null);

    formAnalytics.trackSubmit();
    try {
      if (!isAddressValid(finalAddress)) {
        throw new Error(t('invalidAddress'));
      }

      let chainId: string | undefined;

      if (isKTAddress(finalAddress)) {
        try {
          await tezos.contract.at(finalAddress);
        } catch {
          throw new Error(t('contractNotExistOnNetwork'));
        }

        chainId = await tezos.rpc.getChainId();
      }

      await importWatchOnlyAccount(finalAddress, chainId);

      formAnalytics.trackSubmitSuccess();
    } catch (err: any) {
      formAnalytics.trackSubmitFail();

      console.error(err);

      setError(err.message);
    }
  }, [importWatchOnlyAccount, finalAddress, tezos, formState.isSubmitting, setError, formAnalytics]);

  return (
    <form className="w-full max-w-sm mx-auto my-8" onSubmit={handleSubmit(onSubmit)}>
      {error && <Alert type="error" title={t('error')} description={error} autoFocus className="mb-6" />}

      <Controller
        name="address"
        as={<NoSpaceField ref={addressFieldRef} />}
        control={control}
        rules={{
          required: true,
          validate: (value: any) => validateDelegate(value, domainsClient)
        }}
        onChange={([v]) => v}
        onFocus={() => addressFieldRef.current?.focus()}
        textarea
        rows={2}
        cleanable={Boolean(addressValue)}
        onClean={cleanAddressField}
        id="watch-address"
        label={t('address')}
        testID={ImportAccountSelectors.watchOnlyInput}
        labelDescription={
          <T id={canUseDomainNames ? 'addressInputDescriptionWithDomain' : 'addressInputDescription'} />
        }
        placeholder={t(canUseDomainNames ? 'recipientInputPlaceholderWithDomain' : 'recipientInputPlaceholder')}
        errorCaption={errors.address?.message}
        style={{
          resize: 'none'
        }}
        containerClassName="mb-4"
      />

      {resolvedAddress && (
        <div className="mb-4 -mt-3 text-xs font-light text-gray-600 flex flex-wrap items-center">
          <span className="mr-1 whitespace-nowrap">{t('resolvedAddress')}:</span>
          <span className="font-normal">{resolvedAddress}</span>
        </div>
      )}

      <FormSubmitButton loading={formState.isSubmitting} testID={ImportAccountSelectors.watchOnlyImportButton}>
        {t('importAccount')}
      </FormSubmitButton>
    </form>
  );
};

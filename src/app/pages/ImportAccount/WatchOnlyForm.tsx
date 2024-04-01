import React, { memo, ReactNode, useCallback, useMemo, useRef, useState } from 'react';

import { useForm, Controller } from 'react-hook-form';
import * as Viem from 'viem';

import { Alert, FormSubmitButton, NoSpaceField } from 'app/atoms';
import { useFormAnalytics } from 'lib/analytics';
import { T, t } from 'lib/i18n';
import { useTempleClient, validateDelegate } from 'lib/temple/front';
import { isValidTezosAddress, isTezosContractAddress } from 'lib/tezos';
import { useTezosNetworkRpcUrl } from 'temple/front';
import { useTezosAddressByDomainName, useTezosDomainsClient } from 'temple/front/tezos';
import { getReadOnlyTezos } from 'temple/tezos';
import { TempleChainName } from 'temple/types';

import { ImportAccountSelectors, ImportAccountFormType } from './selectors';

interface WatchOnlyFormData {
  address: string;
}

export const WatchOnlyForm = memo(() => {
  const { importWatchOnlyAccount } = useTempleClient();

  const rpcUrl = useTezosNetworkRpcUrl();
  const domainsClient = useTezosDomainsClient();
  const formAnalytics = useFormAnalytics(ImportAccountFormType.WatchOnly);

  const canUseDomainNames = domainsClient.isSupported;

  const { watch, handleSubmit, errors, control, formState, setValue, triggerValidation } = useForm<WatchOnlyFormData>({
    mode: 'onChange'
  });
  const [error, setError] = useState<ReactNode>(null);

  const addressFieldRef = useRef<HTMLTextAreaElement>(null);

  const addressValue = watch('address');

  const { data: tezAddressFromTzDomainName } = useTezosAddressByDomainName(addressValue);

  const resolvedAddress = useMemo(
    () => tezAddressFromTzDomainName || addressValue,
    [addressValue, tezAddressFromTzDomainName]
  );

  const cleanAddressField = useCallback(() => {
    setValue('address', '');
    triggerValidation('address');
  }, [setValue, triggerValidation]);

  const onSubmit = useCallback(async () => {
    if (formState.isSubmitting) return;

    setError(null);

    formAnalytics.trackSubmit();
    let chain: TempleChainName | nullish;
    try {
      chain = getChainFromAddress(resolvedAddress);

      if (!chain) {
        throw new Error(t('invalidAddress'));
      }

      let tezosChainId: string | undefined;

      if (chain === TempleChainName.Tezos && isTezosContractAddress(resolvedAddress)) {
        const tezos = getReadOnlyTezos(rpcUrl);

        try {
          await tezos.contract.at(resolvedAddress);
        } catch {
          throw new Error(t('contractNotExistOnNetwork'));
        }

        tezosChainId = await tezos.rpc.getChainId();
      }

      const finalAddress = chain === TempleChainName.Tezos ? resolvedAddress : Viem.getAddress(resolvedAddress);

      await importWatchOnlyAccount(chain, finalAddress, tezosChainId);

      formAnalytics.trackSubmitSuccess({ chain });
    } catch (err: any) {
      formAnalytics.trackSubmitFail({ chain });

      console.error(err);

      setError(err.message);
    }
  }, [importWatchOnlyAccount, resolvedAddress, rpcUrl, formState.isSubmitting, setError, formAnalytics]);

  return (
    <form className="w-full max-w-sm mx-auto my-8" onSubmit={handleSubmit(onSubmit)}>
      {error && <Alert type="error" title={t('error')} description={error} autoFocus className="mb-6" />}

      <Controller
        name="address"
        as={<NoSpaceField ref={addressFieldRef} />}
        control={control}
        rules={{
          required: true,
          validate: (value: any) => {
            if (value && Viem.isAddress(value)) return true;

            return validateDelegate(value, domainsClient);
          }
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
          <span className="whitespace-pre-line">
            <u>Tezos:</u> <T id={canUseDomainNames ? 'addressInputDescriptionWithDomain' : 'addressInputDescription'} />
            <br />
            <u>EVM:</u> Public address of the account you want to watch.
          </span>
        }
        placeholder={t(canUseDomainNames ? 'recipientInputPlaceholderWithDomain' : 'recipientInputPlaceholder')}
        errorCaption={errors.address?.message}
        style={{
          resize: 'none'
        }}
        containerClassName="mb-4"
      />

      {tezAddressFromTzDomainName && (
        <div className="mb-4 -mt-3 text-xs font-light text-gray-600 flex flex-wrap items-center">
          <span className="mr-1 whitespace-nowrap">Resolved Tezos address:</span>
          <span className="font-normal">{tezAddressFromTzDomainName}</span>
        </div>
      )}

      <FormSubmitButton loading={formState.isSubmitting} testID={ImportAccountSelectors.watchOnlyImportButton}>
        {t('importAccount')}
      </FormSubmitButton>
    </form>
  );
});

function getChainFromAddress(address: string) {
  if (isValidTezosAddress(address)) return TempleChainName.Tezos;

  if (Viem.isAddress(address)) return TempleChainName.EVM;

  return null;
}

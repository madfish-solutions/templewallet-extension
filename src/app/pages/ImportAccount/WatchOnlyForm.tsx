import React, { memo, ReactNode, useCallback, useMemo, useRef, useState } from 'react';

import { useForm, Controller } from 'react-hook-form';
import * as Viem from 'viem';

import { Alert, FormSubmitButton, NoSpaceField } from 'app/atoms';
import { useFormAnalytics } from 'lib/analytics';
import { t } from 'lib/i18n';
import { useTempleClient, validateDelegate } from 'lib/temple/front';
import { isAddressValid as isValidTezosAddress, isKTAddress } from 'lib/temple/helpers';
import { useTezos } from 'temple/front';
import { useTezosAddressByDomainName, useTezosDomainsClient } from 'temple/front/tzdns';
import { TempleChainName } from 'temple/types';

import { ImportAccountSelectors, ImportAccountFormType } from './selectors';

// console.log('aaa', Viem.isAddress('0x0244f7204b9c554306053Cc557e14D6Cbd40a33C'));
// console.log('bbb', Viem.isAddress('0x0244f7204b9c554306053cc557e14d6cbd40a33c'));
// console.log('ccc', Viem.getAddress('0x0244f7204b9c554306053cc557e14d6cbd40a33c'));

interface WatchOnlyFormData {
  address: string;
}

export const WatchOnlyForm = memo(() => {
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
    try {
      const chain = isValidTezosAddress(resolvedAddress)
        ? TempleChainName.Tezos
        : Viem.isAddress(resolvedAddress)
        ? TempleChainName.EVM
        : null;

      if (!chain) {
        throw new Error(t('invalidAddress'));
      }

      let chainId: string | undefined;

      if (chain === TempleChainName.Tezos && isKTAddress(resolvedAddress)) {
        try {
          await tezos.contract.at(resolvedAddress);
        } catch {
          throw new Error(t('contractNotExistOnNetwork'));
        }

        chainId = await tezos.rpc.getChainId();
      }

      const finalAddress =
        chain === TempleChainName.Tezos
          ? resolvedAddress
          : Viem.getAddress(
              resolvedAddress
              // chainId // TODO: EIP-1191
            );

      await importWatchOnlyAccount(chain, finalAddress, chainId);

      formAnalytics.trackSubmitSuccess();
    } catch (err: any) {
      formAnalytics.trackSubmitFail();

      console.error(err);

      setError(err.message);
    }
  }, [importWatchOnlyAccount, resolvedAddress, tezos, formState.isSubmitting, setError, formAnalytics]);

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
          // <T id={canUseDomainNames ? 'addressInputDescriptionWithDomain' : 'addressInputDescription'} />
          <span className="whitespace-pre-line">
            <u>Tezos:</u> Public key hash or Tezos domain of the account or smart contract.
            <br />
            <u>EVM:</u> ENS name or public address of the account you want to watch.
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

import React, { memo, ReactNode, useCallback, useMemo, useState } from 'react';

import { useForm } from 'react-hook-form';
import * as Viem from 'viem';

import { FormField } from 'app/atoms';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { ScrollView } from 'app/atoms/PageModal/scroll-view';
import { StyledButton } from 'app/atoms/StyledButton';
import { TextButton } from 'app/atoms/TextButton';
import { ReactComponent as PasteFillIcon } from 'app/icons/base/paste_fill.svg';
import { useFormAnalytics } from 'lib/analytics';
import { dipdupNetworksChainIds, searchForTezosAccount } from 'lib/apis/dipdup-search';
import { T, t } from 'lib/i18n';
import { useTempleClient, validateDelegate } from 'lib/temple/front';
import { isValidTezosAddress, isTezosContractAddress } from 'lib/tezos';
import { readClipboard } from 'lib/ui/utils';
import { useEnabledTezosChains } from 'temple/front';
import { getTezosDomainsClient, useTezosAddressByDomainName } from 'temple/front/tezos';
import { TempleChainKind } from 'temple/types';

import { ImportAccountSelectors, ImportAccountFormType } from '../selectors';

interface WatchOnlyFormData {
  address: string;
}

export const WatchOnlyForm = memo(() => {
  const { importWatchOnlyAccount } = useTempleClient();

  const tezosChains = useEnabledTezosChains();
  const domainsClients = useMemo(
    () =>
      tezosChains
        .map(chain => getTezosDomainsClient(chain.chainId, chain.rpcBaseURL))
        .filter(client => client.isSupported),
    [tezosChains]
  );

  const formAnalytics = useFormAnalytics(ImportAccountFormType.WatchOnly);

  const { watch, handleSubmit, errors, register, formState, setValue, triggerValidation } = useForm<WatchOnlyFormData>({
    mode: 'onChange'
  });
  const [error, setError] = useState<ReactNode>(null);
  const [bottomEdgeIsVisible, setBottomEdgeIsVisible] = useState(true);

  const addressValue = watch('address');

  const { data: tezAddressFromTzDomainName } = useTezosAddressByDomainName(addressValue);

  const resolvedAddress = useMemo(
    () => tezAddressFromTzDomainName || addressValue,
    [addressValue, tezAddressFromTzDomainName]
  );

  const pasteAddress = useCallback(
    async () =>
      readClipboard()
        .then(newAddress => setValue('address', newAddress))
        .catch(console.error),
    [setValue]
  );
  const cleanAddressField = useCallback(() => {
    setValue('address', '');
    triggerValidation('address');
  }, [setValue, triggerValidation]);

  const onSubmit = useCallback(async () => {
    if (formState.isSubmitting) return;

    setError(null);

    formAnalytics.trackSubmit();
    let chain: TempleChainKind | nullish;
    try {
      chain = getChainFromAddress(resolvedAddress);

      if (!chain) {
        throw new Error(t('invalidAddress'));
      }

      let tezosChainId: string | undefined;

      if (chain === TempleChainKind.Tezos && isTezosContractAddress(resolvedAddress)) {
        const { items: contractDipdupEntries } = await searchForTezosAccount(resolvedAddress);
        const networkName = contractDipdupEntries[0]?.body.Network;
        tezosChainId = networkName && dipdupNetworksChainIds[networkName];
      }

      const finalAddress = chain === TempleChainKind.Tezos ? resolvedAddress : Viem.getAddress(resolvedAddress);

      await importWatchOnlyAccount(chain, finalAddress, tezosChainId);

      formAnalytics.trackSubmitSuccess({ chain });
    } catch (err: any) {
      formAnalytics.trackSubmitFail({ chain });

      console.error(err);

      setError(err.message);
    }
  }, [resolvedAddress, formState.isSubmitting, setError, formAnalytics, importWatchOnlyAccount]);

  return (
    <form className="flex-1 flex flex-col max-h-full" onSubmit={handleSubmit(onSubmit)}>
      <ScrollView className="py-4" bottomEdgeThreshold={16} onBottomEdgeVisibilityChange={setBottomEdgeIsVisible}>
        <FormField
          textarea
          rows={5}
          ref={register({
            required: t('required'),
            validate: async (value: any) => {
              if (value && Viem.isAddress(value)) return true;

              const validationsResults = await Promise.allSettled(
                domainsClients.map(client => validateDelegate(value, client))
              );

              if (validationsResults.some(result => result.status === 'fulfilled' && result.value === true)) {
                return true;
              }

              const resultWithValidationError = validationsResults.find(
                (result): result is PromiseFulfilledResult<string | boolean> => result.status === 'fulfilled'
              );

              return (
                resultWithValidationError?.value ?? (validationsResults[0] as PromiseRejectedResult).reason?.message
              );
            }
          })}
          type="text"
          name="address"
          id="watch-address"
          label={t('address')}
          placeholder={t('watchOnlyAddressInputPlaceholder')}
          errorCaption={errors.address?.message ?? error}
          shouldShowErrorCaption
          className="resize-none"
          containerClassName="mb-8"
          cleanable={Boolean(addressValue)}
          labelDescription={t('watchOnlyAddressInputDescription')}
          onClean={cleanAddressField}
          additonalActionButtons={
            addressValue ? null : (
              <TextButton
                color="blue"
                Icon={PasteFillIcon}
                onClick={pasteAddress}
                testID={ImportAccountSelectors.PasteAddressButton}
              >
                <T id="paste" />
              </TextButton>
            )
          }
          testID={ImportAccountSelectors.watchOnlyInput}
        />

        {tezAddressFromTzDomainName && (
          <div className="mb-4 -mt-3 text-xs font-light text-gray-600 flex flex-wrap items-center">
            <span className="mr-1 whitespace-nowrap">Resolved Tezos address:</span>
            <span className="font-normal">{tezAddressFromTzDomainName}</span>
          </div>
        )}
      </ScrollView>

      <ActionsButtonsBox shouldCastShadow={!bottomEdgeIsVisible}>
        <StyledButton
          size="L"
          type="submit"
          disabled={formState.isSubmitting}
          testID={ImportAccountSelectors.privateKeyImportButton}
          color="primary"
        >
          <T id="watchAddress" />
        </StyledButton>
      </ActionsButtonsBox>
    </form>
  );
});

function getChainFromAddress(address: string) {
  if (isValidTezosAddress(address)) return TempleChainKind.Tezos;

  if (Viem.isAddress(address)) return TempleChainKind.EVM;

  return null;
}

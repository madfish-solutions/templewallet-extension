import React, { memo, ReactNode, useCallback, useMemo, useState } from 'react';

import { useForm } from 'react-hook-form';
import * as Viem from 'viem';
import { normalize } from 'viem/ens';

import { FormField } from 'app/atoms';
import { StyledButton } from 'app/atoms/StyledButton';
import { TextButton } from 'app/atoms/TextButton';
import { ReactComponent as PasteFillIcon } from 'app/icons/base/paste_fill.svg';
import { PageModalScrollViewWithActions } from 'app/templates/page-modal-scroll-view-with-actions';
import { useFormAnalytics } from 'lib/analytics';
import { dipdupNetworksChainIds, searchForTezosAccount } from 'lib/apis/dipdup-search';
import { T, t } from 'lib/i18n';
import { useTempleClient, validateDelegate } from 'lib/temple/front';
import { isValidTezosAddress, isTezosContractAddress } from 'lib/tezos';
import { shouldDisableSubmitButton } from 'lib/ui/should-disable-submit-button';
import { readClipboard } from 'lib/ui/utils';
import { fifoResolve } from 'lib/utils';
import { TezosChain, useEnabledTezosChains } from 'temple/front';
import { useEvmAddressByDomainName } from 'temple/front/evm/helpers';
import { getTezosDomainsClient, useTezosAddressByDomainName } from 'temple/front/tezos';
import { getTezosReadOnlyRpcClient } from 'temple/tezos';
import { TempleChainKind } from 'temple/types';

import { ImportAccountSelectors, ImportAccountFormType } from '../selectors';
import { ImportAccountFormProps } from '../types';

interface WatchOnlyFormData {
  address: string;
}

export const WatchOnlyForm = memo<ImportAccountFormProps>(({ onSuccess }) => {
  const { importWatchOnlyAccount } = useTempleClient();

  const tezosChains = useEnabledTezosChains();
  const domainsClients = useMemo(
    () => tezosChains.map(chain => getTezosDomainsClient(chain)).filter(client => client.isSupported),
    [tezosChains]
  );

  const formAnalytics = useFormAnalytics(ImportAccountFormType.WatchOnly);

  const { watch, handleSubmit, errors, register, formState, setValue, triggerValidation } = useForm<WatchOnlyFormData>({
    mode: 'onChange'
  });
  const [submitError, setSubmitError] = useState<ReactNode>(null);
  const resetSubmitError = useCallback(() => setSubmitError(null), []);

  const addressValue = watch('address');

  const { data: tezAddressFromTzDomainName } = useTezosAddressByDomainName(addressValue);
  const { data: evmAddressFromDomainName } = useEvmAddressByDomainName(addressValue);

  const resolvedAddress = useMemo(
    () => evmAddressFromDomainName || tezAddressFromTzDomainName || addressValue,
    [addressValue, evmAddressFromDomainName, tezAddressFromTzDomainName]
  );

  const handleArtificalAddressChange = useCallback(
    (newValue: string) => {
      setValue('address', newValue);
      setSubmitError(null);
      triggerValidation('address');
    },
    [setValue, triggerValidation]
  );

  const pasteAddress = useCallback(
    async () => readClipboard().then(handleArtificalAddressChange).catch(console.error),
    [handleArtificalAddressChange]
  );
  const cleanAddressField = useCallback(() => handleArtificalAddressChange(''), [handleArtificalAddressChange]);

  const onSubmit = useCallback(async () => {
    if (formState.isSubmitting) return;

    setSubmitError(null);

    formAnalytics.trackSubmit();
    let chain: TempleChainKind | nullish;
    try {
      chain = getChainFromAddress(resolvedAddress);

      if (!chain) {
        throw new Error(t('invalidAddress'));
      }

      let tezosChainId: string | undefined;

      if (chain === TempleChainKind.Tezos && isTezosContractAddress(resolvedAddress)) {
        tezosChainId = await getTezosChainId(resolvedAddress, tezosChains);

        if (!tezosChainId) {
          throw new Error(t('contractNotExistOnKnownNetworks'));
        }
      }

      const finalAddress = chain === TempleChainKind.Tezos ? resolvedAddress : Viem.getAddress(resolvedAddress);

      await importWatchOnlyAccount(chain, finalAddress, tezosChainId);

      formAnalytics.trackSubmitSuccess({ chain });
      onSuccess();
    } catch (err: any) {
      formAnalytics.trackSubmitFail({ chain });

      console.error(err);

      setSubmitError(err.message);
    }
  }, [formState.isSubmitting, formAnalytics, resolvedAddress, importWatchOnlyAccount, onSuccess, tezosChains]);

  const validateAddress = useMemo(
    () =>
      fifoResolve(async (value: any) => {
        let isNormalizableEns = false;
        try {
          if (value) {
            normalize(value);
            isNormalizableEns = true;
          }
          // eslint-disable-next-line no-empty
        } catch {}

        if (value && (Viem.isAddress(value) || isNormalizableEns)) {
          return true;
        }

        const validationsResults = await Promise.allSettled(
          domainsClients.map(client => validateDelegate(value, client))
        );

        if (validationsResults.some(result => result.status === 'fulfilled' && result.value === true)) {
          return true;
        }

        const resultWithValidationError = validationsResults.find(
          (result): result is PromiseFulfilledResult<string | boolean> => result.status === 'fulfilled'
        );

        return resultWithValidationError?.value ?? (validationsResults[0] as PromiseRejectedResult).reason.message;
      }),
    [domainsClients]
  );

  return (
    <form className="flex-1 flex flex-col max-h-full" onSubmit={handleSubmit(onSubmit)}>
      <PageModalScrollViewWithActions
        className="py-4"
        bottomEdgeThreshold={16}
        actionsBoxProps={{
          children: (
            <StyledButton
              size="L"
              type="submit"
              disabled={shouldDisableSubmitButton({ errors, formState, otherErrors: [submitError] })}
              testID={ImportAccountSelectors.privateKeyImportButton}
              color="primary"
            >
              <T id="watchAddress" />
            </StyledButton>
          )
        }}
      >
        <FormField
          textarea
          rows={5}
          ref={register({
            required: t('required'),
            validate: validateAddress
          })}
          type="text"
          name="address"
          id="watch-address"
          label={t('address')}
          placeholder={t('watchOnlyAddressInputPlaceholder')}
          errorCaption={errors.address?.message ?? submitError}
          shouldShowErrorCaption
          className="resize-none"
          containerClassName="mb-8"
          cleanable={Boolean(addressValue)}
          labelDescription={t('watchOnlyAddressInputDescription')}
          onClean={cleanAddressField}
          onChange={resetSubmitError}
          additionalActionButtons={
            addressValue ? null : (
              <TextButton
                color="blue"
                Icon={PasteFillIcon}
                onClick={pasteAddress}
                testID={ImportAccountSelectors.pasteAddressButton}
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
      </PageModalScrollViewWithActions>
    </form>
  );
});

async function getTezosChainId(contractAddress: string, tezosChains: TezosChain[]) {
  let dipdupSearchFailed = false;
  try {
    const { items: contractDipdupEntries } = await searchForTezosAccount(contractAddress);
    const networkName = contractDipdupEntries[0]?.body.Network;
    const dipdupChainId = networkName && dipdupNetworksChainIds[networkName];

    if (dipdupChainId) {
      return dipdupChainId;
    }
  } catch {
    dipdupSearchFailed = true;
  }

  const rpcContractSearchResults = await Promise.allSettled(
    tezosChains
      .filter(({ chainId }) => dipdupSearchFailed || !Object.values(dipdupNetworksChainIds).includes(chainId))
      .map(async chain => {
        const tezos = getTezosReadOnlyRpcClient(chain);

        await tezos.contract.at(contractAddress);

        return chain.chainId;
      })
  );

  return rpcContractSearchResults.find(
    (result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled'
  )?.value;
}

function getChainFromAddress(address: string) {
  if (isValidTezosAddress(address)) return TempleChainKind.Tezos;

  if (Viem.isAddress(address)) return TempleChainKind.EVM;

  return null;
}

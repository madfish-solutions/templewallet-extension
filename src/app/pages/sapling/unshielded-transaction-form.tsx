import { memo, useCallback } from 'react';

import { OpKind } from '@taquito/taquito';
import { isEmpty } from 'lodash';
import { Controller, useForm } from 'react-hook-form';

import { NoSpaceField } from 'app/atoms';
import AssetField from 'app/atoms/AssetField';
import { StyledButton } from 'app/atoms/StyledButton';
import { toastError, toastSuccess } from 'app/toaster';
import { t } from 'lib/i18n';
import { useTempleClient, validateRecipient as validateAddress } from 'lib/temple/front';
import { tzToMutez } from 'lib/temple/helpers';
import { readClipboard } from 'lib/ui/utils';
import { getTezosToolkitWithSigner } from 'temple/front';
import { useGetTezosActiveBlockExplorer } from 'temple/front/ready';
import { getTezosDomainsClient } from 'temple/front/tezos';
import { makeBlockExplorerHref } from 'temple/front/use-block-explorers';
import { TempleChainKind } from 'temple/types';

import { DEFAULT_TRANSACTION_FORM_VALUES } from './constants';
import { TransactionFormData, TransactionFormProps } from './types';
import { validateAmount } from './utils';

export const UnshieldedTransactionForm = memo<TransactionFormProps>(
  ({ accountId, network, saplingContractAddress, sender }) => {
    const { prepareSaplingContractTransaction } = useTempleClient();
    const domainsClient = getTezosDomainsClient(network);
    const { handleSubmit, control, formState, setValue } = useForm<TransactionFormData>({
      defaultValues: DEFAULT_TRANSACTION_FORM_VALUES,
      mode: 'onSubmit',
      reValidateMode: 'onChange'
    });
    const { submitCount, errors, isSubmitting } = formState;
    const formSubmitted = submitCount > 0;
    const getActiveBlockExplorer = useGetTezosActiveBlockExplorer();
    const blockExplorer = getActiveBlockExplorer(network.chainId);

    const validateRecipient = useCallback(
      (address: string) => {
        if (!address) return t('required');

        return validateAddress(address, domainsClient);
      },
      [domainsClient]
    );

    const onSubmit = useCallback(
      async ({ to, amount }: TransactionFormData) => {
        try {
          const tezos = getTezosToolkitWithSigner(network, sender, true);
          const saplingTx = await prepareSaplingContractTransaction(
            accountId,
            {
              type: 'unshielded',
              params: { to, amount: tzToMutez(amount).toNumber(), mutez: true }
            },
            network,
            saplingContractAddress
          );
          console.log('saplingTx', saplingTx);
          const batch = await tezos.wallet
            .batch([
              {
                kind: OpKind.TRANSACTION,
                to: saplingContractAddress,
                amount: 0,
                parameter: { entrypoint: 'default', value: [{ bytes: saplingTx }] }
              }
            ])
            .send();
          toastSuccess('Transaction submitted', undefined, {
            hash: batch.opHash,
            blockExplorerHref: makeBlockExplorerHref(blockExplorer.url, batch.opHash, 'tx', TempleChainKind.Tezos)
          });
        } catch (error) {
          console.error(error);
          toastError('Failed to shield funds');
        }
      },
      [accountId, network, prepareSaplingContractTransaction, saplingContractAddress, sender, blockExplorer.url]
    );

    const handleAmountClean = useCallback(
      () => setValue('amount', '', { shouldValidate: formSubmitted }),
      [setValue, formSubmitted]
    );

    const handleToClean = useCallback(
      () => setValue('to', '', { shouldValidate: formSubmitted }),
      [setValue, formSubmitted]
    );

    const handlePasteButtonClick = useCallback(() => {
      readClipboard()
        .then(value => setValue('to', value, { shouldValidate: formSubmitted }))
        .catch(console.error);
    }, [formSubmitted, setValue]);

    return (
      <form className="flex flex-col my-2 gap-1" onSubmit={handleSubmit(onSubmit)}>
        <Controller
          name="amount"
          control={control}
          rules={{ validate: validateAmount }}
          render={({ field: { value, onChange, onBlur }, formState }) => (
            <AssetField
              value={value}
              onBlur={onBlur}
              onChange={v => onChange(v ?? '')}
              assetDecimals={6}
              cleanable={Boolean(value)}
              shouldShowErrorCaption={true}
              placeholder="0.00"
              extraFloatingInner="TEZ"
              errorCaption={formState.submitCount > 0 ? formState.errors.amount?.message : null}
              onClean={handleAmountClean}
              label={t('amount')}
            />
          )}
        />

        <Controller
          name="to"
          control={control}
          rules={{ validate: validateRecipient }}
          render={({ field: { value, onChange, onBlur }, formState }) => (
            <NoSpaceField
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              extraRightInnerWrapper="unset"
              textarea
              showPasteButton
              rows={3}
              cleanable={Boolean(value)}
              onClean={handleToClean}
              onPasteButtonClick={handlePasteButtonClick}
              id="unshielded-send-to"
              label={t('recipient')}
              placeholder="Address or Domain name"
              errorCaption={formState.submitCount > 0 ? formState.errors.to?.message : null}
              style={{ resize: 'none' }}
            />
          )}
        />

        <StyledButton
          type="submit"
          size="L"
          color="primary"
          loading={isSubmitting}
          disabled={formSubmitted && !isEmpty(errors)}
        >
          Unshield TEZ
        </StyledButton>
      </form>
    );
  }
);

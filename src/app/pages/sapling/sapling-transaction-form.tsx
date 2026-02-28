import { memo, useCallback } from 'react';

import { OpKind } from '@taquito/taquito';
import { isEmpty } from 'lodash';
import { Controller, useForm } from 'react-hook-form';

import { FormField, NoSpaceField } from 'app/atoms';
import AssetField from 'app/atoms/AssetField';
import { StyledButton } from 'app/atoms/StyledButton';
import { toastError, toastSuccess } from 'app/toaster';
import { t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import { tzToMutez } from 'lib/temple/helpers';
import { readClipboard } from 'lib/ui/utils';
import { getTezosToolkitWithSigner } from 'temple/front';
import { useGetTezosActiveBlockExplorer } from 'temple/front/ready';
import { makeBlockExplorerHref } from 'temple/front/use-block-explorers';
import { TempleChainKind } from 'temple/types';

import { DEFAULT_TRANSACTION_FORM_VALUES_WITH_MEMO } from './constants';
import { TransactionFormDataWithMemo, TransactionFormProps } from './types';
import { validateAmount, validateSaplingAddress } from './utils';

const validateMemo = (value: string) => !value || Buffer.from(value, 'utf-8').length <= 8 || 'Cannot exceed 8 bytes';

export const SaplingTransactionForm = memo<TransactionFormProps>(
  ({ accountId, network, saplingContractAddress, sender }) => {
    const { prepareSaplingContractTransaction } = useTempleClient();
    const { handleSubmit, control, formState, setValue } = useForm<TransactionFormDataWithMemo>({
      defaultValues: DEFAULT_TRANSACTION_FORM_VALUES_WITH_MEMO,
      mode: 'onSubmit',
      reValidateMode: 'onChange'
    });
    const { submitCount, errors, isSubmitting } = formState;
    const formSubmitted = submitCount > 0;
    const getActiveBlockExplorer = useGetTezosActiveBlockExplorer();
    const blockExplorer = getActiveBlockExplorer(network.chainId);

    const onSubmit = useCallback(
      async ({ to, amount, memo }: TransactionFormDataWithMemo) => {
        try {
          const tezos = getTezosToolkitWithSigner(network, sender, true);
          const saplingTx = await prepareSaplingContractTransaction(
            accountId,
            {
              type: 'sapling',
              params: [{ to, amount: tzToMutez(amount).toNumber(), mutez: true, memo }]
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
                parameter: {
                  entrypoint: 'default',
                  value: [
                    {
                      bytes: saplingTx
                    }
                  ]
                }
              }
            ])
            .send();
          toastSuccess('Transaction submitted', undefined, {
            hash: batch.opHash,
            blockExplorerHref: makeBlockExplorerHref(blockExplorer.url, batch.opHash, 'tx', TempleChainKind.Tezos)
          });
        } catch (error) {
          console.error(error);
          toastError('Failed to send funds');
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
          rules={{ validate: validateSaplingAddress }}
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
              id="sapling-send-to"
              label={t('recipient')}
              placeholder="Address"
              errorCaption={formState.submitCount > 0 ? formState.errors.to?.message : null}
              style={{ resize: 'none' }}
            />
          )}
        />

        <Controller
          name="memo"
          control={control}
          rules={{ validate: validateMemo }}
          render={({ field: { value, onChange, onBlur }, formState }) => (
            <FormField
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              label={t('memo')}
              maxLength={8}
              placeholder="Memo"
              id="sapling-memo"
              errorCaption={formState.submitCount > 0 ? formState.errors.memo?.message : null}
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
          Send TEZ
        </StyledButton>
      </form>
    );
  }
);

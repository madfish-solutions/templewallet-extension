import React, { memo, useCallback, useMemo, useState } from 'react';

import { Controller, FormProvider, useForm } from 'react-hook-form-v7';

import { FormField, IconBase } from 'app/atoms';
import { PageModal } from 'app/atoms/PageModal';
import { SettingsCheckbox } from 'app/atoms/SettingsCheckbox';
import { StyledButton } from 'app/atoms/StyledButton';
import { Tooltip } from 'app/atoms/Tooltip';
import { useNetworksValuesToExclude } from 'app/hooks/use-networks-values-to-exclude';
import { ReactComponent as LockFillIcon } from 'app/icons/base/lock_fill.svg';
import { PageModalScrollViewWithActions } from 'app/templates/page-modal-scroll-view-with-actions';
import { T, t } from 'lib/i18n';
import { useGetTezosGasMetadata } from 'lib/metadata';
import { useAbortSignal } from 'lib/ui/hooks';
import { shouldDisableSubmitButton } from 'lib/ui/should-disable-submit-button';
import { OneOfChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { EditNetworkFormValues } from '../types';

import { EditChainModalSelectors } from './selectors';

interface EditChainModalProps {
  chain: OneOfChains;
  onClose: EmptyFn;
  onSubmit: (values: EditNetworkFormValues) => Promise<void>;
}

export const EditChainModal = memo<EditChainModalProps>(({ chain, onClose, onSubmit }) => {
  const { abort } = useAbortSignal();
  const { namesToExclude } = useNetworksValuesToExclude(chain);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const getTezosGasMetadata = useGetTezosGasMetadata();

  const defaultValues = useMemo(() => {
    const { name, chainId, testnet, kind } = chain;

    return {
      name,
      symbol: kind === TempleChainKind.Tezos ? getTezosGasMetadata(chain.chainId).symbol : chain.currency.symbol,
      chainId,
      testnet
    };
  }, [chain, getTezosGasMetadata]);
  const formReturn = useForm<EditNetworkFormValues>({
    mode: 'onChange',
    defaultValues
  });
  const { control, reset, formState, register, setValue, watch, handleSubmit } = formReturn;
  const symbol = watch('symbol');
  const name = watch('name');
  const { isSubmitting, submitCount, errors } = formState;
  const isSubmitted = submitCount > 0;

  const resetSubmitError = useCallback(() => setSubmitError(null), []);
  const closeModal = useCallback(() => {
    reset(defaultValues);
    resetSubmitError();
    abort();
    onClose();
  }, [abort, onClose, reset, resetSubmitError, defaultValues]);

  const makeClearFieldFn = useCallback(
    (name: Exclude<keyof EditNetworkFormValues, 'testnet' | 'chainId'>) => () =>
      setValue(name, '', { shouldValidate: true }),
    [setValue]
  );
  const clearName = useMemo(() => makeClearFieldFn('name'), [makeClearFieldFn]);
  const clearSymbol = useMemo(() => makeClearFieldFn('symbol'), [makeClearFieldFn]);

  return (
    <PageModal opened onRequestClose={closeModal} title={t('editNetwork')}>
      <FormProvider {...formReturn}>
        <form className="flex-1 flex flex-col max-h-full" onSubmit={handleSubmit(onSubmit)}>
          <PageModalScrollViewWithActions
            className="py-4"
            bottomEdgeThreshold={16}
            actionsBoxProps={{
              children: (
                <StyledButton
                  className="w-full"
                  size="L"
                  color="primary"
                  disabled={shouldDisableSubmitButton({
                    errors,
                    formState,
                    otherErrors: [submitError],
                    disableWhileSubmitting: false
                  })}
                  loading={isSubmitting}
                  type="submit"
                  testID={EditChainModalSelectors.saveButton}
                >
                  <T id="save" />
                </StyledButton>
              )
            }}
            initialBottomEdgeVisible={false}
          >
            <div className="flex flex-col relative">
              <div className="flex flex-col gap-4">
                <FormField
                  {...register('name', {
                    required: t('required'),
                    validate: value => (namesToExclude.includes(value) ? t('mustBeUnique') : true)
                  })}
                  cleanable={Boolean(name)}
                  onClean={clearName}
                  disabled={isSubmitting}
                  type="text"
                  label={<T id="name" />}
                  fieldWrapperBottomMargin={false}
                  errorCaption={isSubmitted && errors.name?.message}
                  placeholder="Ethereum"
                  testID={EditChainModalSelectors.nameInput}
                />

                <FormField
                  {...register('symbol', { required: t('required') })}
                  cleanable={Boolean(symbol)}
                  disabled={isSubmitting}
                  onClean={clearSymbol}
                  label={<T id="symbol" />}
                  placeholder="ETH"
                  errorCaption={isSubmitted && errors.symbol?.message}
                  testID={EditChainModalSelectors.symbolInput}
                />

                <FormField
                  {...register('chainId')}
                  readOnly
                  additionalActionButtons={<IconBase size={16} Icon={LockFillIcon} className="text-grey-3" />}
                  labelContainerClassName="w-full flex justify-between items-center"
                  label={
                    <>
                      <T id="chainId" />
                      <Tooltip
                        content={
                          <span className="font-normal">
                            <T id="chainIdTooltip" />
                          </span>
                        }
                        size={16}
                        className="text-grey-3"
                        wrapperClassName="max-w-60"
                      />
                    </>
                  }
                  placeholder="1"
                  testID={EditChainModalSelectors.chainIdInput}
                />
              </div>

              <Controller
                control={control}
                name="testnet"
                render={({ field }) => (
                  <SettingsCheckbox
                    {...field}
                    checked={field.value}
                    disabled={isSubmitting}
                    label={<T id="testnet" />}
                    testID={EditChainModalSelectors.testnetCheckbox}
                  />
                )}
              />
            </div>
          </PageModalScrollViewWithActions>
        </form>
      </FormProvider>
    </PageModal>
  );
});

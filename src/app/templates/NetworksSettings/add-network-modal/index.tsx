import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { noop } from 'lodash';
import { Controller, useForm } from 'react-hook-form-v7';

import { FormField } from 'app/atoms';
import { PageModal } from 'app/atoms/PageModal';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { ScrollView } from 'app/atoms/PageModal/scroll-view';
import { SettingsCheckbox } from 'app/atoms/SettingsCheckbox';
import { StyledButton } from 'app/atoms/StyledButton';
import { Tooltip } from 'app/atoms/Tooltip';
import { UrlInput } from 'app/templates/UrlInput';
import { T, t } from 'lib/i18n';
import { isValidTezosChainId } from 'lib/tezos';
import { shouldDisableSubmitButton } from 'lib/ui/should-disable-submit-button';
import { OneOfChains, useAllEvmChains, useAllTezosChains } from 'temple/front';

import { NetworkSettingsSelectors } from '../selectors';

import { NameInput } from './name-input';
import { AddNetworkFormValues, ViemChain } from './types';
import { useAddNetwork } from './use-add-network';
import { useRpcSuggestedFormValues } from './use-rpc-suggested-form-values';
import { NUMERIC_CHAIN_ID_REGEX, makeFormValues } from './utils';

interface AddNetworkModalProps {
  isOpen: boolean;
  onClose: EmptyFn;
}

const defaultValues = {
  name: '',
  rpcUrl: '',
  chainId: '',
  symbol: '',
  explorerUrl: '',
  testnet: false
};

export const AddNetworkModal = memo<AddNetworkModalProps>(({ isOpen, onClose }) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bottomEdgeIsVisible, setBottomEdgeIsVisible] = useState(false);
  const [lastSelectedChain, setLastSelectedChain] = useState<ViemChain | null>(null);

  const evmChains = useAllEvmChains();
  const tezChains = useAllTezosChains();

  const { namesToExclude, rpcUrlsToExclude, explorersUrlsToExclude } = useMemo(() => {
    const result: Record<'rpcUrlsToExclude' | 'explorersUrlsToExclude' | 'namesToExclude', string[]> = {
      rpcUrlsToExclude: [],
      explorersUrlsToExclude: [],
      namesToExclude: []
    };
    const populateResult = (chain: OneOfChains) => {
      result.rpcUrlsToExclude.push(...chain.allRpcs.map(({ rpcBaseURL }) => rpcBaseURL));
      result.explorersUrlsToExclude.push(...chain.allBlockExplorers.map(({ url }) => url));
      result.namesToExclude.push(chain.name);
    };

    for (const tezChainId in tezChains) {
      populateResult(tezChains[tezChainId]);
    }
    for (const evmChainId in evmChains) {
      populateResult(evmChains[evmChainId]);
    }

    return result;
  }, [evmChains, tezChains]);

  const formReturn = useForm<AddNetworkFormValues>({
    mode: 'onChange',
    defaultValues
  });
  const { control, reset, formState, register, setValue, watch, handleSubmit } = formReturn;
  const formValues = watch();
  const { chainId, rpcUrl, symbol } = formValues;
  const { isSubmitting, submitCount, errors } = formState;
  const isSubmitted = submitCount > 0;

  const prevSuggestedFormValuesRef = useRef<Partial<AddNetworkFormValues> | null | undefined>(null);
  const { data: suggestedFormValues, isLoading: suggestedFormValuesLoading } = useRpcSuggestedFormValues(
    rpcUrl,
    rpcUrlsToExclude
  );
  useEffect(() => {
    if (prevSuggestedFormValuesRef.current === suggestedFormValues) {
      return;
    }

    prevSuggestedFormValuesRef.current = suggestedFormValues;

    if (suggestedFormValues) {
      console.log('oy vey 2', suggestedFormValues);
      reset({ ...formValues, ...suggestedFormValues });
    }
  }, [formValues, reset, suggestedFormValues]);

  const resetSubmitError = useCallback(() => setSubmitError(null), []);
  const closeModal = useCallback(() => {
    reset(defaultValues);
    resetSubmitError();
    onClose();
  }, [onClose, reset, resetSubmitError]);
  const onSubmit = useAddNetwork(setSubmitError, lastSelectedChain, closeModal);

  const handleChainSelect = useCallback(
    (chain: ViemChain) => {
      setLastSelectedChain(chain);
      reset(makeFormValues(chain));
    },
    [reset]
  );

  const makeClearFieldFn = useCallback(
    (name: Exclude<keyof AddNetworkFormValues, 'testnet'>) => () => setValue(name, '', { shouldValidate: true }),
    [setValue]
  );
  const clearChainId = useMemo(() => makeClearFieldFn('chainId'), [makeClearFieldFn]);
  const clearSymbol = useMemo(() => makeClearFieldFn('symbol'), [makeClearFieldFn]);

  const validateChainId = useCallback(
    (chainId: string) => {
      if (evmChains[chainId] || tezChains[chainId]) {
        return t('mustBeUnique');
      }

      if (NUMERIC_CHAIN_ID_REGEX.test(chainId)) {
        return true;
      }

      return isValidTezosChainId(chainId) || t('invalidChainId');
    },
    [evmChains, tezChains]
  );

  return (
    <PageModal opened={isOpen} onRequestClose={closeModal} title={t('addNetwork')}>
      <form className="flex-1 flex flex-col max-h-full" onSubmit={handleSubmit(onSubmit)}>
        <ScrollView
          className="py-4 gap-4"
          bottomEdgeThreshold={16}
          onBottomEdgeVisibilityChange={setBottomEdgeIsVisible}
        >
          <NameInput formReturn={formReturn} namesToExclude={namesToExclude} onChainSelect={handleChainSelect} />

          <div className="flex flex-col gap-8">
            <UrlInput
              name="rpcUrl"
              label="RPC URL"
              formReturn={formReturn}
              urlsToExclude={rpcUrlsToExclude}
              isEditable
              id="add-network-rpc-url"
              placeholder="https://rpc.link"
              showErrorBeforeSubmit
              submitError={submitError}
              textarea
              required
              resetSubmitError={resetSubmitError}
              pasteButtonTestID={NetworkSettingsSelectors.pasteRpcUrlButton}
              testID={NetworkSettingsSelectors.rpcUrlInput}
            />

            <FormField
              {...register('chainId', {
                required: t('required'),
                validate: validateChainId,
                onChange: resetSubmitError
              })}
              cleanable={Boolean(chainId)}
              onClean={clearChainId}
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
              errorCaption={isSubmitted && errors.chainId?.message}
              testID={NetworkSettingsSelectors.chainIdInput}
            />

            <FormField
              {...register('symbol', { required: t('required') })}
              cleanable={Boolean(symbol)}
              onClean={clearSymbol}
              label={<T id="symbol" />}
              placeholder="ETH"
              errorCaption={isSubmitted && errors.symbol?.message}
              testID={NetworkSettingsSelectors.symbolInput}
            />
          </div>

          <div className="flex flex-col gap-8">
            <UrlInput
              name="explorerUrl"
              label={<T id="blockExplorerUrl" />}
              formReturn={formReturn}
              urlsToExclude={explorersUrlsToExclude}
              isEditable
              id="add-network-explorer-url"
              placeholder="https://etherscan.io"
              submitError={undefined}
              textarea={false}
              required={false}
              resetSubmitError={noop}
              pasteButtonTestID={NetworkSettingsSelectors.pasteExplorerUrlButton}
              testID={NetworkSettingsSelectors.explorerUrlInput}
            />

            <Controller
              control={control}
              name="testnet"
              render={({ field }) => (
                <SettingsCheckbox
                  {...field}
                  checked={field.value}
                  label={<T id="testnet" />}
                  testID={NetworkSettingsSelectors.testnetCheckbox}
                />
              )}
            />
          </div>
        </ScrollView>

        <ActionsButtonsBox shouldCastShadow={!bottomEdgeIsVisible}>
          <StyledButton
            className="w-full"
            size="L"
            color="primary"
            disabled={shouldDisableSubmitButton({
              errors,
              formState,
              errorsBeforeSubmitFields: ['rpcUrl'],
              otherErrors: [submitError],
              disableWhileSubmitting: false
            })}
            loading={suggestedFormValuesLoading || isSubmitting}
            type="submit"
            testID={NetworkSettingsSelectors.saveButton}
          >
            <T id="save" />
          </StyledButton>
        </ActionsButtonsBox>
      </form>
    </PageModal>
  );
});

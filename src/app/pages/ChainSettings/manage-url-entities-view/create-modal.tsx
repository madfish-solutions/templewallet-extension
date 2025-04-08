import React, { memo, useCallback, useState } from 'react';

import { Controller, useForm } from 'react-hook-form-v7';

import { FormField } from 'app/atoms';
import { CLOSE_ANIMATION_TIMEOUT, PageModal } from 'app/atoms/PageModal';
import { SettingsCheckbox } from 'app/atoms/SettingsCheckbox';
import { StyledButton } from 'app/atoms/StyledButton';
import { PageModalScrollViewWithActions } from 'app/templates/page-modal-scroll-view-with-actions';
import { toastError, toastSuccess } from 'app/toaster';
import { T, TID, t } from 'lib/i18n';
import { useAbortSignal } from 'lib/ui/hooks';
import { isAbortError } from 'lib/ui/is-abort-error';
import { shouldDisableSubmitButton } from 'lib/ui/should-disable-submit-button';

import { ChainSettingsSelectors } from '../selectors';

import { UrlInput } from './url-input';

export interface CreateUrlEntityModalFormValues {
  name: string;
  url: string;
  isActive: boolean;
}

interface CreateUrlEntityModalProps {
  opened: boolean;
  activeI18nKey: TID;
  successMessageI18nKey: TID;
  namePlaceholder: string;
  title: string;
  urlInputPlaceholder: string;
  namesToExclude: string[];
  urlsToExclude: string[];
  onClose: EmptyFn;
  createEntity: (values: CreateUrlEntityModalFormValues, signal: AbortSignal) => Promise<void>;
  activeCheckboxTestID: string;
}

export const CreateUrlEntityModal = memo(
  ({
    opened,
    activeI18nKey,
    successMessageI18nKey,
    title,
    namePlaceholder,
    namesToExclude,
    urlsToExclude,
    urlInputPlaceholder,
    onClose,
    createEntity,
    activeCheckboxTestID
  }: CreateUrlEntityModalProps) => {
    const { abort, abortAndRenewSignal } = useAbortSignal();
    const [submitError, setSubmitError] = useState<string | null>(null);
    const formReturn = useForm<CreateUrlEntityModalFormValues>({
      mode: 'onChange'
    });
    const { control, register, handleSubmit, formState, reset } = formReturn;
    const { errors, isSubmitting, submitCount } = formState;
    const isSubmitted = submitCount > 0;

    const resetSubmitError = useCallback(() => setSubmitError(null), []);
    const closeModal = useCallback(() => {
      abort();
      reset({ name: '', url: '', isActive: false });
      resetSubmitError();
      onClose();
    }, [abort, onClose, reset, resetSubmitError]);

    const onSubmit = useCallback(
      async (values: CreateUrlEntityModalFormValues) => {
        try {
          const signal = abortAndRenewSignal();
          await createEntity(values, signal);
          closeModal();
          setTimeout(() => toastSuccess(t(successMessageI18nKey)), CLOSE_ANIMATION_TIMEOUT + 100);
        } catch (error) {
          if (isAbortError(error)) {
            return;
          }

          toastError(error instanceof Error ? error.message : String(error));
          setSubmitError(t('wrongAddress'));
        }
      },
      [abortAndRenewSignal, closeModal, createEntity, successMessageI18nKey]
    );

    return (
      <PageModal opened={opened} onRequestClose={closeModal} title={title} shouldChangeBottomShift={false}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col max-h-full">
          <PageModalScrollViewWithActions
            className="pt-4 pb-6"
            bottomEdgeThreshold={24}
            actionsBoxProps={{
              children: (
                <StyledButton
                  size="L"
                  color="primary"
                  type="submit"
                  loading={isSubmitting}
                  disabled={shouldDisableSubmitButton({
                    errors,
                    formState,
                    otherErrors: [submitError],
                    disableWhileSubmitting: false
                  })}
                  testID={ChainSettingsSelectors.saveButton}
                >
                  <T id="save" />
                </StyledButton>
              )
            }}
          >
            <div className="flex-1 flex flex-col">
              <FormField
                {...register('name', {
                  required: t('required'),
                  validate: (value: string) => (namesToExclude.includes(value) ? t('mustBeUnique') : true)
                })}
                disabled={isSubmitting}
                label={t('name')}
                id="createurlentity-name"
                placeholder={namePlaceholder}
                errorCaption={isSubmitted && errors.name?.message}
                testID={ChainSettingsSelectors.nameInput}
              />

              <UrlInput
                formReturn={formReturn}
                urlsToExclude={urlsToExclude}
                disabled={isSubmitting}
                isEditable
                id="createurlentity-url"
                placeholder={urlInputPlaceholder}
                submitError={submitError}
                resetSubmitError={resetSubmitError}
              />
            </div>
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <SettingsCheckbox
                  {...field}
                  checked={field.value}
                  disabled={isSubmitting}
                  label={<T id={activeI18nKey} />}
                  testID={activeCheckboxTestID}
                />
              )}
            />
          </PageModalScrollViewWithActions>
        </form>
      </PageModal>
    );
  }
);

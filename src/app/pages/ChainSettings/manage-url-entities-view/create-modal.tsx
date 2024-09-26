import React, { memo, useCallback, useState } from 'react';

import { Controller, useForm } from 'react-hook-form';

import { FormField } from 'app/atoms';
import { CLOSE_ANIMATION_TIMEOUT, PageModal } from 'app/atoms/PageModal';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { ScrollView } from 'app/atoms/PageModal/scroll-view';
import { SettingsCheckbox } from 'app/atoms/SettingsCheckbox';
import { StyledButton } from 'app/atoms/StyledButton';
import { toastError, toastSuccess } from 'app/toaster';
import { T, TID, t } from 'lib/i18n';
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
  title: string;
  urlInputPlaceholder: string;
  namesToExclude: string[];
  urlsToExclude: string[];
  onClose: EmptyFn;
  createEntity: (values: CreateUrlEntityModalFormValues) => Promise<void>;
  activeCheckboxTestID: string;
}

export const CreateUrlEntityModal = memo(
  ({
    opened,
    activeI18nKey,
    successMessageI18nKey,
    title,
    namesToExclude,
    urlsToExclude,
    urlInputPlaceholder,
    onClose,
    createEntity,
    activeCheckboxTestID
  }: CreateUrlEntityModalProps) => {
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [bottomEdgeIsVisible, setBottomEdgeIsVisible] = useState(true);
    const formContextValues = useForm<CreateUrlEntityModalFormValues>({
      mode: 'onChange'
    });
    const { control, register, handleSubmit, formState, errors, reset } = formContextValues;
    const { isSubmitting, submitCount } = formState;
    const isSubmitted = submitCount > 0;

    const resetSubmitError = useCallback(() => setSubmitError(null), []);
    const closeModal = useCallback(() => {
      reset({ name: '', url: '', isActive: false });
      resetSubmitError();
      onClose();
    }, [onClose, reset, resetSubmitError]);

    const onSubmit = useCallback(
      async (values: CreateUrlEntityModalFormValues) => {
        try {
          await createEntity(values);
          closeModal();
          setTimeout(() => toastSuccess(t(successMessageI18nKey)), CLOSE_ANIMATION_TIMEOUT * 2);
        } catch (error) {
          toastError(error instanceof Error ? error.message : String(error));
          setSubmitError(t('wrongAddress'));
        }
      },
      [closeModal, createEntity, successMessageI18nKey]
    );

    return (
      <PageModal opened={opened} onRequestClose={closeModal} title={title}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col max-h-full">
          <ScrollView
            className="pt-4 pb-6"
            bottomEdgeThreshold={24}
            onBottomEdgeVisibilityChange={setBottomEdgeIsVisible}
          >
            <div className="flex-1 flex flex-col">
              <FormField
                ref={register({
                  required: t('required'),
                  validate: value => (namesToExclude.includes(value) ? t('mustBeUnique') : true)
                })}
                name="name"
                label={t('name')}
                id="createurlentity-name"
                placeholder="Ethereum"
                errorCaption={isSubmitted && errors.name?.message}
                testID={ChainSettingsSelectors.nameInput}
              />

              <UrlInput
                formContextValues={formContextValues}
                urlsToExclude={urlsToExclude}
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
              as={SettingsCheckbox}
              label={<T id={activeI18nKey} />}
              testID={activeCheckboxTestID}
            />
          </ScrollView>
          <ActionsButtonsBox shouldCastShadow={!bottomEdgeIsVisible} shouldChangeBottomShift={false}>
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
          </ActionsButtonsBox>
        </form>
      </PageModal>
    );
  }
);

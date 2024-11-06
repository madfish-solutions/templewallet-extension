import React, { useCallback, useState } from 'react';

import { Controller, useForm } from 'react-hook-form-v7';

import { FormField, IconBase, ToggleSwitch } from 'app/atoms';
import { ActionModalBodyContainer, ActionModalButton, ActionModalButtonsContainer } from 'app/atoms/action-modal';
import { PageModal } from 'app/atoms/PageModal';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { ScrollView } from 'app/atoms/PageModal/scroll-view';
import { SettingsCellSingle } from 'app/atoms/SettingsCell';
import { SettingsCellGroup } from 'app/atoms/SettingsCellGroup';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as DeleteIcon } from 'app/icons/base/delete.svg';
import { ReactComponent as LockFillIcon } from 'app/icons/base/lock_fill.svg';
import { toastError } from 'app/toaster';
import { T, TID, t } from 'lib/i18n';
import { useAbortSignal, useBooleanState } from 'lib/ui/hooks';
import { shouldDisableSubmitButton } from 'lib/ui/should-disable-submit-button';

import { ChainSettingsSelectors } from '../selectors';
import { ShortenedEntityNameActionModal } from '../shortened-entity-name-action-modal';
import { ShortenedEntityNameActionTitle } from '../shortened-entity-name-action-title';

import { UrlEntityBase } from './types';
import { UrlInput } from './url-input';

export interface EditUrlEntityModalFormValues {
  name: string;
  url: string;
  isActive: boolean;
}

interface EditUrlEntityModalProps<T extends UrlEntityBase> {
  isActive: boolean;
  isEditable: boolean;
  isRemovable: boolean;
  canChangeActiveState: boolean;
  entity: T;
  entityUrl: string;
  namesToExclude: string[];
  urlsToExclude: string[];
  activeI18nKey: TID;
  titleI18nKeyBase: 'editSomeRpc' | 'editSomeBlockExplorer';
  confirmDeleteTitleI18nKeyBase: 'confirmDeleteRpcTitle' | 'confirmDeleteBlockExplorerTitle';
  confirmDeleteDescriptionI18nKey: TID;
  deleteLabelI18nKey: TID;
  namePlaceholder: string;
  urlInputPlaceholder: string;
  onClose: EmptyFn;
  onRemoveConfirm: EmptyFn;
  updateEntity: (entity: T, values: EditUrlEntityModalFormValues, signal: AbortSignal) => Promise<void>;
  activeSwitchTestID: string;
}

export const EditUrlEntityModal = <T extends UrlEntityBase>({
  isActive,
  isEditable,
  isRemovable,
  canChangeActiveState,
  entity,
  entityUrl,
  namesToExclude,
  urlsToExclude,
  activeI18nKey,
  titleI18nKeyBase,
  confirmDeleteTitleI18nKeyBase,
  confirmDeleteDescriptionI18nKey,
  deleteLabelI18nKey,
  namePlaceholder,
  urlInputPlaceholder,
  onClose,
  onRemoveConfirm,
  updateEntity,
  activeSwitchTestID
}: EditUrlEntityModalProps<T>) => {
  const { abort, abortAndRenewSignal } = useAbortSignal();
  const [removeModalIsOpen, openRemoveModal, closeRemoveModal] = useBooleanState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bottomEdgeIsVisible, setBottomEdgeIsVisible] = useState(true);
  const formReturn = useForm<EditUrlEntityModalFormValues>({
    defaultValues: { name: entity.name, url: entityUrl, isActive },
    mode: 'onChange'
  });
  const { control, register, handleSubmit, formState } = formReturn;
  const { errors, submitCount, isSubmitting } = formState;
  const isSubmitted = submitCount > 0;
  const displayedName = entity.nameI18nKey ? t(entity.nameI18nKey) : entity.name;

  const handleDeleteConfirm = useCallback(() => {
    closeRemoveModal();
    onRemoveConfirm();
  }, [closeRemoveModal, onRemoveConfirm]);
  const resetSubmitError = useCallback(() => setSubmitError(null), []);

  const handleRequestClose = useCallback(() => {
    abort();
    onClose();
  }, [abort, onClose]);

  const onSubmit = useCallback(
    async (values: EditUrlEntityModalFormValues) => {
      try {
        const signal = abortAndRenewSignal();
        await updateEntity(entity, values, signal);
        onClose();
      } catch (error) {
        toastError(error instanceof Error ? error.message : String(error));
        setSubmitError(t('wrongAddress'));
      }
    },
    [abortAndRenewSignal, entity, onClose, updateEntity]
  );

  return (
    <>
      <PageModal
        headerClassName="flex justify-center truncate"
        opened
        onRequestClose={handleRequestClose}
        title={<ShortenedEntityNameActionTitle entityName={displayedName} i18nKeyBase={titleI18nKeyBase} />}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col max-h-full">
          <ScrollView
            className="pt-4 pb-6"
            bottomEdgeThreshold={24}
            onBottomEdgeVisibilityChange={setBottomEdgeIsVisible}
          >
            <SettingsCellGroup className="mb-4">
              <SettingsCellSingle cellName={<T id={activeI18nKey} />} Component="div">
                <Controller
                  control={control}
                  disabled={!canChangeActiveState || isSubmitting}
                  name="isActive"
                  render={({ field }) => <ToggleSwitch {...field} checked={field.value} testID={activeSwitchTestID} />}
                />
              </SettingsCellSingle>
            </SettingsCellGroup>

            <FormField
              {...register('name', {
                required: t('required'),
                validate: (value: string) => (namesToExclude.includes(value) ? t('mustBeUnique') : true)
              })}
              className={isEditable ? '' : 'text-grey-1'}
              additonalActionButtons={!isEditable && <IconBase size={16} Icon={LockFillIcon} className="text-grey-3" />}
              label={t('name')}
              id="editurlentity-name"
              placeholder={namePlaceholder}
              errorCaption={isSubmitted && errors.name?.message}
              disabled={!isEditable || isSubmitting}
              testID={ChainSettingsSelectors.nameInput}
            />

            <UrlInput
              disabled={isSubmitting}
              formReturn={formReturn}
              urlsToExclude={urlsToExclude}
              isEditable={isEditable}
              id="editurlentity-url"
              placeholder={urlInputPlaceholder}
              submitError={submitError}
              resetSubmitError={resetSubmitError}
            />

            {isRemovable && (
              <div className="flex justify-center mt-4">
                <StyledButton
                  size="S"
                  color="red-low"
                  className="bg-transparent flex items-center px-3 py-1 gap-0.5"
                  onClick={openRemoveModal}
                  testID={ChainSettingsSelectors.deleteButton}
                  type="button"
                >
                  <T id={deleteLabelI18nKey} />
                  <IconBase size={12} Icon={DeleteIcon} />
                </StyledButton>
              </div>
            )}
          </ScrollView>
          <ActionsButtonsBox shouldCastShadow={!bottomEdgeIsVisible} shouldChangeBottomShift={false}>
            <StyledButton
              size="L"
              color="primary"
              type="submit"
              loading={isSubmitting}
              disabled={shouldDisableSubmitButton({ errors, formState, otherErrors: [submitError] })}
              testID={ChainSettingsSelectors.saveButton}
            >
              <T id="save" />
            </StyledButton>
          </ActionsButtonsBox>
        </form>
      </PageModal>

      {removeModalIsOpen && (
        <ShortenedEntityNameActionModal
          titleI18nKeyBase={confirmDeleteTitleI18nKeyBase}
          entityName={displayedName}
          hasCloseButton={false}
          onClose={closeRemoveModal}
        >
          <ActionModalBodyContainer>
            <p className="py-1 text-center text-font-description text-grey-1">
              <T id={confirmDeleteDescriptionI18nKey} />
            </p>
          </ActionModalBodyContainer>
          <ActionModalButtonsContainer>
            <ActionModalButton
              color="primary-low"
              onClick={closeRemoveModal}
              type="button"
              testID={ChainSettingsSelectors.cancelDeleteButton}
            >
              <T id="cancel" />
            </ActionModalButton>

            <ActionModalButton
              color="red"
              type="button"
              testID={ChainSettingsSelectors.confirmDeleteButton}
              onClick={handleDeleteConfirm}
            >
              <T id="delete" />
            </ActionModalButton>
          </ActionModalButtonsContainer>
        </ShortenedEntityNameActionModal>
      )}
    </>
  );
};

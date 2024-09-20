import React, { useCallback, useState } from 'react';

import { useForm } from 'react-hook-form';

import { FormField, IconBase, ToggleSwitch } from 'app/atoms';
import {
  ActionModal,
  ActionModalBodyContainer,
  ActionModalButton,
  ActionModalButtonsContainer
} from 'app/atoms/action-modal';
import { PageModal } from 'app/atoms/PageModal';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { ScrollView } from 'app/atoms/PageModal/scroll-view';
import { SettingsCell } from 'app/atoms/SettingsCell';
import { SettingsCellGroup } from 'app/atoms/SettingsCellGroup';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as DeleteIcon } from 'app/icons/base/delete.svg';
import { ReactComponent as LockFillIcon } from 'app/icons/base/lock_fill.svg';
import { toastError } from 'app/toaster';
import { T, TID, t } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';
import { shouldDisableSubmitButton } from 'lib/ui/should-disable-submit-button';

import { ChainSettingsSelectors } from '../selectors';

import { UrlEntityBase } from './types';
import { UrlInput } from './url-input';

export interface EditUrlEntityModalFormValues {
  name: string;
  url: string;
}

interface EditUrlEntityModalProps<T extends UrlEntityBase> {
  isActive: boolean;
  canChangeActiveState: boolean;
  isEditable: boolean;
  isRemovable: boolean;
  entity: T;
  entityUrl: string;
  namesToExclude: string[];
  urlsToExclude: string[];
  activeI18nKey: TID;
  titleI18nKey: TID;
  confirmDeleteTitleI18nKey: TID;
  confirmDeleteDescriptionI18nKey: TID;
  urlInputPlaceholder: string;
  onClose: EmptyFn;
  onActiveStateChange: SyncFn<boolean>;
  onRemoveConfirm: EmptyFn;
  updateEntity: (entity: T, values: EditUrlEntityModalFormValues) => Promise<void>;
  activeSwitchTestID: string;
}

export const EditUrlEntityModal = <T extends UrlEntityBase>({
  isActive,
  canChangeActiveState,
  isEditable,
  isRemovable,
  entity,
  entityUrl,
  namesToExclude,
  urlsToExclude,
  activeI18nKey,
  titleI18nKey,
  confirmDeleteTitleI18nKey,
  confirmDeleteDescriptionI18nKey,
  urlInputPlaceholder,
  onClose,
  onActiveStateChange,
  onRemoveConfirm,
  updateEntity,
  activeSwitchTestID
}: EditUrlEntityModalProps<T>) => {
  const [removeModalIsOpen, openRemoveModal, closeRemoveModal] = useBooleanState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bottomEdgeIsVisible, setBottomEdgeIsVisible] = useState(true);
  const formContextValues = useForm<EditUrlEntityModalFormValues>({
    defaultValues: { name: entity.name, url: entityUrl },
    mode: 'onChange'
  });
  const { register, handleSubmit, formState, errors } = formContextValues;
  const isSubmitted = formState.submitCount > 0;
  const displayedName = entity.nameI18nKey ? t(entity.nameI18nKey) : entity.name;

  const handleDeleteConfirm = useCallback(() => {
    closeRemoveModal();
    onRemoveConfirm();
  }, [closeRemoveModal, onRemoveConfirm]);
  const resetSubmitError = useCallback(() => setSubmitError(null), []);

  const onSubmit = useCallback(
    async (values: EditUrlEntityModalFormValues) => {
      try {
        await updateEntity(entity, values);
        onClose();
      } catch (error) {
        toastError(error instanceof Error ? error.message : String(error));
        setSubmitError(t('wrongAddress'));
      }
    },
    [entity, onClose, updateEntity]
  );

  return (
    <>
      <PageModal opened onRequestClose={onClose} title={t(titleI18nKey, displayedName)}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col max-h-full">
          <ScrollView
            className="pt-4 pb-6 gap-4"
            bottomEdgeThreshold={24}
            onBottomEdgeVisibilityChange={setBottomEdgeIsVisible}
          >
            <SettingsCellGroup>
              <SettingsCell cellName={<T id={activeI18nKey} />} Component="div">
                <ToggleSwitch
                  checked={isActive}
                  disabled={!canChangeActiveState}
                  onChange={onActiveStateChange}
                  testID={activeSwitchTestID}
                />
              </SettingsCell>
            </SettingsCellGroup>

            <FormField
              ref={register({
                required: t('required'),
                validate: value => (namesToExclude.includes(value) ? t('mustBeUnique') : true)
              })}
              className={isEditable ? '' : 'text-grey-1'}
              additonalActionButtons={!isEditable && <IconBase size={16} Icon={LockFillIcon} className="text-grey-3" />}
              name="name"
              label={t('name')}
              id="editurlentity-name"
              placeholder="Ethereum"
              errorCaption={isSubmitted && errors.name?.message}
              disabled={!isEditable}
              testID={ChainSettingsSelectors.nameInput}
            />

            <UrlInput
              formContextValues={formContextValues}
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
                >
                  <T id="deleteRpc" />
                  <IconBase size={12} Icon={DeleteIcon} />
                </StyledButton>
              </div>
            )}
          </ScrollView>
          <ActionsButtonsBox shouldCastShadow={!bottomEdgeIsVisible}>
            <StyledButton
              size="L"
              color="primary"
              type={isEditable ? 'submit' : 'button'}
              disabled={shouldDisableSubmitButton(errors, formState)}
              testID={ChainSettingsSelectors.saveButton}
              onClick={isEditable ? undefined : onClose}
            >
              <T id="save" />
            </StyledButton>
          </ActionsButtonsBox>
        </form>
      </PageModal>

      {removeModalIsOpen && (
        <ActionModal
          hasCloseButton={false}
          onClose={closeRemoveModal}
          title={t(confirmDeleteTitleI18nKey, displayedName)}
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
        </ActionModal>
      )}
    </>
  );
};

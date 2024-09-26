import React, { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import { isEqual } from 'lodash';

import { Button, IconBase } from 'app/atoms';
import { SettingsCell } from 'app/atoms/SettingsCell';
import { SettingsCellGroup } from 'app/atoms/SettingsCellGroup';
import { ReactComponent as PlusIcon } from 'app/icons/base/plus.svg';
import { TID } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';

import { CreateUrlEntityModal, CreateUrlEntityModalFormValues } from './create-modal';
import { EditUrlEntityModal, EditUrlEntityModalFormValues } from './edit-modal';
import { ManageUrlEntitiesItem } from './item';
import { UrlEntityBase } from './types';

interface ManageUrlEntitiesViewProps<T> {
  title: ReactNode;
  items: T[];
  activeItemId: string;
  editModalTitleI18nKey: TID;
  activeI18nKey: TID;
  confirmDeleteTitleI18nKey: TID;
  confirmDeleteDescriptionI18nKey: TID;
  deleteLabelI18nKey: TID;
  successfullyAddedMessageI18nKey: TID;
  createModalTitle: string;
  urlInputPlaceholder: string;
  getEntityUrl: SyncFn<T, string>;
  createEntity: (values: CreateUrlEntityModalFormValues) => Promise<void>;
  updateEntity: (entity: T, values: EditUrlEntityModalFormValues) => Promise<void>;
  removeEntity: (id: string) => Promise<void>;
  addButtonTestID: string;
  itemTestID: string;
  activeSwitchTestID: string;
  activeCheckboxTestID: string;
}

export const ManageUrlEntitiesView = <T extends UrlEntityBase>({
  title,
  items,
  activeItemId,
  editModalTitleI18nKey,
  activeI18nKey,
  confirmDeleteTitleI18nKey,
  confirmDeleteDescriptionI18nKey,
  deleteLabelI18nKey,
  successfullyAddedMessageI18nKey,
  createModalTitle,
  urlInputPlaceholder,
  getEntityUrl,
  createEntity,
  updateEntity,
  removeEntity,
  addButtonTestID,
  itemTestID,
  activeSwitchTestID,
  activeCheckboxTestID
}: ManageUrlEntitiesViewProps<T>) => {
  const [entityToEdit, setEntityToEdit] = useState<T | null>(null);
  const [createModalOpen, openCreateModal, closeCreateModal] = useBooleanState(false);

  const namesToExclude = useMemo(
    () => items.map(({ name }) => name).filter(name => name !== entityToEdit?.name),
    [entityToEdit?.name, items]
  );
  const urlsToExclude = useMemo(
    () => items.map(getEntityUrl).filter(url => !entityToEdit || url !== getEntityUrl(entityToEdit)),
    [entityToEdit, getEntityUrl, items]
  );

  const closeEditModal = useCallback(() => setEntityToEdit(null), []);

  const handleRemoveConfirm = useCallback(() => {
    closeEditModal();
    removeEntity(entityToEdit!.id);
  }, [closeEditModal, entityToEdit, removeEntity]);

  useEffect(() => {
    if (!entityToEdit) {
      return;
    }

    const entityFromList = items.find(item => item.id === entityToEdit.id);

    if (entityFromList && !isEqual(entityFromList, entityToEdit)) {
      setEntityToEdit(entityFromList);
    } else if (!entityFromList) {
      closeEditModal();
    }
  }, [closeEditModal, entityToEdit, items]);

  return (
    <>
      <SettingsCellGroup className="overflow-hidden">
        <SettingsCell
          isLast={false}
          cellName={<span className="text-font-description-bold">{title}</span>}
          Component="div"
        >
          <Button onClick={openCreateModal} testID={addButtonTestID}>
            <IconBase Icon={PlusIcon} size={16} className="text-secondary" />
          </Button>
        </SettingsCell>
        {items.map(item => (
          <ManageUrlEntitiesItem
            key={item.id}
            item={item}
            isActive={item.id === activeItemId}
            getEntityUrl={getEntityUrl}
            onClick={setEntityToEdit}
            testID={itemTestID}
          />
        ))}
      </SettingsCellGroup>

      {entityToEdit && (
        <EditUrlEntityModal
          activeI18nKey={activeI18nKey}
          titleI18nKey={editModalTitleI18nKey}
          confirmDeleteTitleI18nKey={confirmDeleteTitleI18nKey}
          confirmDeleteDescriptionI18nKey={confirmDeleteDescriptionI18nKey}
          deleteLabelI18nKey={deleteLabelI18nKey}
          urlInputPlaceholder={urlInputPlaceholder}
          isActive={entityToEdit.id === activeItemId}
          isEditable={!entityToEdit.default}
          isRemovable={!entityToEdit.default && items.length > 1}
          canChangeActiveState={
            items.length > 1 && (activeItemId !== entityToEdit.id || items.indexOf(entityToEdit) > 0)
          }
          entity={entityToEdit}
          entityUrl={getEntityUrl(entityToEdit)}
          namesToExclude={namesToExclude}
          urlsToExclude={urlsToExclude}
          onClose={closeEditModal}
          onRemoveConfirm={handleRemoveConfirm}
          updateEntity={updateEntity}
          activeSwitchTestID={activeSwitchTestID}
        />
      )}

      <CreateUrlEntityModal
        opened={createModalOpen}
        activeI18nKey={activeI18nKey}
        successMessageI18nKey={successfullyAddedMessageI18nKey}
        title={createModalTitle}
        namesToExclude={namesToExclude}
        urlsToExclude={urlsToExclude}
        urlInputPlaceholder={urlInputPlaceholder}
        onClose={closeCreateModal}
        createEntity={createEntity}
        activeCheckboxTestID={activeCheckboxTestID}
      />
    </>
  );
};

import React, { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import { isEqual } from 'lodash';

import { Button, IconBase } from 'app/atoms';
import { SettingsCellSingle } from 'app/atoms/SettingsCell';
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
  editModalTitleI18nKeyBase: 'editSomeRpc' | 'editSomeBlockExplorer';
  activeI18nKey: TID;
  confirmDeleteTitleI18nKeyBase: 'confirmDeleteRpcTitle' | 'confirmDeleteBlockExplorerTitle';
  confirmDeleteDescriptionI18nKey: TID;
  deleteLabelI18nKey: TID;
  successfullyAddedMessageI18nKey: TID;
  createModalTitle: string;
  urlInputPlaceholder: string;
  namePlaceholder: string;
  getEntityUrl: SyncFn<T, string>;
  createEntity: (values: CreateUrlEntityModalFormValues, signal: AbortSignal) => Promise<void>;
  updateEntity: (entity: T, values: EditUrlEntityModalFormValues, signal: AbortSignal) => Promise<void>;
  removeEntity: (id: string) => Promise<void>;
  addButtonTestID: string;
  itemTestID: string;
  activeSwitchTestID: string;
  activeCheckboxTestID: string;
  hideDefaultUrlEntityText?: string;
}

export const ManageUrlEntitiesView = <T extends UrlEntityBase>({
  title,
  items,
  activeItemId,
  editModalTitleI18nKeyBase,
  activeI18nKey,
  confirmDeleteTitleI18nKeyBase,
  confirmDeleteDescriptionI18nKey,
  deleteLabelI18nKey,
  successfullyAddedMessageI18nKey,
  createModalTitle,
  hideDefaultUrlEntityText,
  urlInputPlaceholder,
  namePlaceholder,
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
        <SettingsCellSingle
          isLast={false}
          cellName={<span className="text-font-description-bold flex-1">{title}</span>}
          wrapCellName={false}
          Component="div"
        >
          <Button onClick={openCreateModal} testID={addButtonTestID}>
            <IconBase Icon={PlusIcon} size={16} className="text-secondary" />
          </Button>
        </SettingsCellSingle>

        {items.map(item => (
          <ManageUrlEntitiesItem
            key={item.id}
            item={item}
            hideDefaultEntityUrl={isDefined(hideDefaultUrlEntityText)}
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
          titleI18nKeyBase={editModalTitleI18nKeyBase}
          confirmDeleteTitleI18nKeyBase={confirmDeleteTitleI18nKeyBase}
          confirmDeleteDescriptionI18nKey={confirmDeleteDescriptionI18nKey}
          deleteLabelI18nKey={deleteLabelI18nKey}
          urlInputPlaceholder={urlInputPlaceholder}
          namePlaceholder={namePlaceholder}
          isActive={entityToEdit.id === activeItemId}
          isEditable={!entityToEdit.default}
          isRemovable={!entityToEdit.default && items.length > 1}
          canChangeActiveState={
            items.length > 1 && (activeItemId !== entityToEdit.id || items.indexOf(entityToEdit) > 0)
          }
          entity={entityToEdit}
          entityUrl={getEntityUrl(entityToEdit)}
          hideDefaultUrlEntityText={hideDefaultUrlEntityText}
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
        namePlaceholder={namePlaceholder}
        onClose={closeCreateModal}
        createEntity={createEntity}
        activeCheckboxTestID={activeCheckboxTestID}
      />
    </>
  );
};

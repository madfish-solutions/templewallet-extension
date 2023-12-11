import React, { FC, FormEventHandler, useCallback, useEffect, useRef, useState } from 'react';

import classNames from 'clsx';

import { FormField, Button } from 'app/atoms';
import Name from 'app/atoms/Name';
import { ACCOUNT_NAME_PATTERN } from 'app/defaults';
import { ReactComponent as EditIcon } from 'app/icons/edit.svg';
import { useFormAnalytics } from 'lib/analytics';
import { T, t } from 'lib/i18n';
import { useTempleClient, useAccount } from 'lib/temple/front';
import { useAlert } from 'lib/ui/dialog';

import { HomeSelectors } from '../Home.selectors';

import { EditableTitleSelectors } from './EditableTitle.selectors';

const buttonClassNames = [
  'py-1 rounded overflow-hidden',
  'text-gray-600 text-sm',
  'transition ease-in-out duration-200',
  'hover:bg-black hover:bg-opacity-5',
  'opacity-75 hover:opacity-100 focus:opacity-100'
];

const EditableTitle: FC = () => {
  const { editAccountName } = useTempleClient();
  const account = useAccount();
  const customAlert = useAlert();
  const formAnalytics = useFormAnalytics('ChangeAccountName');

  const [editing, setEditing] = useState(false);

  const editAccNameFieldRef = useRef<HTMLInputElement>(null);
  const accNamePrevRef = useRef<string>();

  useEffect(() => {
    if (accNamePrevRef.current && accNamePrevRef.current !== account.name && editing) {
      setEditing(false);
    }

    accNamePrevRef.current = account.name;
  }, [account.name, editing, setEditing]);

  useEffect(() => {
    if (editing) {
      editAccNameFieldRef.current?.focus();
    }
  }, [editing]);

  const autoCancelTimeoutRef = useRef<number>();

  useEffect(
    () => () => {
      clearTimeout(autoCancelTimeoutRef.current);
    },
    []
  );

  const handleEditClick = useCallback(() => {
    setEditing(true);
  }, [setEditing]);

  const handleCancelClick = useCallback(() => {
    setEditing(false);
  }, [setEditing]);

  const handleEditSubmit = useCallback<FormEventHandler>(
    evt => {
      evt.preventDefault();

      (async () => {
        formAnalytics.trackSubmit();
        try {
          const newName = editAccNameFieldRef.current?.value;
          if (newName && newName !== account.name) {
            await editAccountName(account.publicKeyHash, newName);
          }

          setEditing(false);

          formAnalytics.trackSubmitSuccess();
        } catch (err: any) {
          formAnalytics.trackSubmitFail();

          console.error(err);

          await customAlert({
            title: t('errorChangingAccountName'),
            children: err.message
          });
        }
      })();
    },
    [account.name, editAccountName, account.publicKeyHash, customAlert, formAnalytics]
  );

  const handleEditFieldFocus = useCallback(() => {
    clearTimeout(autoCancelTimeoutRef.current);
  }, []);

  const handleEditFieldBlur = useCallback(() => {
    autoCancelTimeoutRef.current = window.setTimeout(() => {
      setEditing(false);
    }, 5_000);
  }, [setEditing]);

  return (
    <div className="relative flex items-center pt-2 mb-1">
      {editing ? (
        <form className="flex flex-col items-center flex-1" onSubmit={handleEditSubmit}>
          <FormField
            ref={editAccNameFieldRef}
            name="name"
            defaultValue={account.name}
            maxLength={16}
            pattern={ACCOUNT_NAME_PATTERN.toString().slice(1, -1)}
            title={t('accountNameInputTitle')}
            spellCheck={false}
            className="w-full mx-auto max-w-xs text-2xl font-light text-gray-700 text-center"
            style={{ padding: '0.075rem 0' }}
            onFocus={handleEditFieldFocus}
            onBlur={handleEditFieldBlur}
          />

          <div className="flex items-stretch mb-2">
            <Button
              type="button"
              className={classNames(buttonClassNames, 'mx-1 px-2')}
              onClick={handleCancelClick}
              testID={EditableTitleSelectors.cancelButton}
            >
              <T id="cancel" />
            </Button>

            <Button className={classNames(buttonClassNames, 'mx-1 px-2')} testID={EditableTitleSelectors.saveButton}>
              <T id="save" />
            </Button>
          </div>
        </form>
      ) : (
        <>
          <Name
            className="pl-1 text-gray-700 text-center text-gray-910"
            style={{ maxWidth: '24rem', fontSize: 23 }}
            testID={HomeSelectors.accountNameText}
          >
            {account.name}
          </Name>

          {!editing && (
            <Button
              className={classNames(buttonClassNames, 'px-1')}
              onClick={handleEditClick}
              testID={EditableTitleSelectors.editButton}
            >
              <EditIcon className="h-4 w-auto stroke-current stroke-2" />
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default EditableTitle;

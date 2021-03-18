import React, { FC, FormEventHandler, useCallback, useEffect, useRef, useState } from "react";

import classNames from "clsx";

import { Button } from "app/atoms/Button";
import FormField from "app/atoms/FormField";
import Name from "app/atoms/Name";
import { ReactComponent as EditIcon } from "app/icons/edit.svg";
import { useFormAnalytics } from "lib/analytics";
import { T, t } from "lib/i18n/react";
import { useTempleClient, useAccount } from "lib/temple/front";
import { useAlert } from "lib/ui/dialog";

import { EditableTitleSelectors } from "./EditableTitle.selectors";

const EditableTitle: FC = () => {
  const { editAccountName } = useTempleClient();
  const account = useAccount();
  const alert = useAlert();
  const formAnalytics = useFormAnalytics('ChangeAccountName');

  const [editing, setEditing] = useState(false);

  const editAccNameFieldRef = useRef<HTMLInputElement>(null);
  const accNamePrevRef = useRef<string>();

  useEffect(() => {
    if (
      accNamePrevRef.current &&
      accNamePrevRef.current !== account.name &&
      editing
    ) {
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
    (evt) => {
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
        } catch (err) {
          formAnalytics.trackSubmitFail();

          if (process.env.NODE_ENV === "development") {
            console.error(err);
          }

          await alert({
            title: t("errorChangingAccountName"),
            children: err.message,
          });
        }
      })();
    },
    [account.name, editAccountName, account.publicKeyHash, alert, formAnalytics]
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
    <div className="relative flex items-center justify-center pt-4">
      {editing ? (
        <form
          className="flex flex-col items-center flex-1"
          onSubmit={handleEditSubmit}
        >
          <FormField
            ref={editAccNameFieldRef}
            name="name"
            defaultValue={account.name}
            maxLength={16}
            pattern="^[a-zA-Z0-9 _-]{1,16}$"
            title={t("accountNameInputTitle")}
            spellCheck={false}
            className={classNames(
              "w-full mx-auto max-w-xs",
              "text-2xl font-light text-gray-700 text-center"
            )}
            style={{ padding: "0.075rem 0" }}
            onFocus={handleEditFieldFocus}
            onBlur={handleEditFieldBlur}
          />

          <div className="flex items-stretch mb-2">
            <T id="cancel">
              {(message) => (
                <Button
                  type="button"
                  className={classNames(
                    "mx-1",
                    "px-2 py-1",
                    "rounded overflow-hidden",
                    "text-gray-600 text-sm",
                    "transition ease-in-out duration-200",
                    "hover:bg-black hover:bg-opacity-5",
                    "opacity-75 hover:opacity-100 focus:opacity-100"
                  )}
                  onClick={handleCancelClick}
                  testID={EditableTitleSelectors.CancelButton}
                >
                  {message}
                </Button>
              )}
            </T>

            <T id="save">
              {(message) => (
                <Button
                  className={classNames(
                    "mx-1",
                    "px-2 py-1",
                    "rounded overflow-hidden",
                    "text-gray-600 text-sm",
                    "transition ease-in-out duration-200",
                    "hover:bg-black hover:bg-opacity-5",
                    "opacity-75 hover:opacity-100 focus:opacity-100"
                  )}
                  testID={EditableTitleSelectors.SaveButton}
                >
                  {message}
                </Button>
              )}
            </T>
          </div>
        </form>
      ) : (
        <Name
          className={classNames(
            "mb-2",
            "text-2xl font-light text-gray-700 text-center"
          )}
          style={{ maxWidth: "20rem" }}
        >
          {account.name}
        </Name>
      )}

      {!editing && (
        <Button
          className={classNames(
            "absolute top-0 right-0",
            "px-2 py-1",
            "rounded overflow-hidden",
            "flex items-center",
            "text-gray-600 text-sm",
            "transition ease-in-out duration-200",
            "hover:bg-black hover:bg-opacity-5",
            "opacity-75 hover:opacity-100 focus:opacity-100"
          )}
          onClick={handleEditClick}
          testID={EditableTitleSelectors.EditButton}
        >
          <EditIcon
            className={classNames(
              "-ml-1 mr-1 h-4 w-auto stroke-current stroke-2"
            )}
          />
          <T id="edit" />
        </Button>
      )}
    </div>
  );
};

export default EditableTitle;

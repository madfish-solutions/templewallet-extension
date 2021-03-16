import * as React from "react";
import classNames from "clsx";
import { useTempleClient, useAccount } from "lib/temple/front";
import { T, t } from "lib/i18n/react";
import { useAlert } from "lib/ui/dialog";
import Name from "app/atoms/Name";
import FormField from "app/atoms/FormField";
import { ReactComponent as EditIcon } from "app/icons/edit.svg";

const EditableTitle: React.FC = () => {
  const { editAccountName } = useTempleClient();
  const account = useAccount();
  const alert = useAlert();

  const [editing, setEditing] = React.useState(false);

  const editAccNameFieldRef = React.useRef<HTMLInputElement>(null);
  const accNamePrevRef = React.useRef<string>();

  React.useEffect(() => {
    if (
      accNamePrevRef.current &&
      accNamePrevRef.current !== account.name &&
      editing
    ) {
      setEditing(false);
    }

    accNamePrevRef.current = account.name;
  }, [account.name, editing, setEditing]);

  React.useEffect(() => {
    if (editing) {
      editAccNameFieldRef.current?.focus();
    }
  }, [editing]);

  const autoCancelTimeoutRef = React.useRef<number>();

  React.useEffect(
    () => () => {
      clearTimeout(autoCancelTimeoutRef.current);
    },
    []
  );

  const handleEditClick = React.useCallback(() => {
    setEditing(true);
  }, [setEditing]);

  const handleCancelClick = React.useCallback(() => {
    setEditing(false);
  }, [setEditing]);

  const handleEditSubmit = React.useCallback<React.FormEventHandler>(
    (evt) => {
      evt.preventDefault();

      (async () => {
        try {
          const newName = editAccNameFieldRef.current?.value;
          if (newName && newName !== account.name) {
            await editAccountName(account.publicKeyHash, newName);
          }

          setEditing(false);
        } catch (err) {
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
    [account.name, editAccountName, account.publicKeyHash, alert]
  );

  const handleEditFieldFocus = React.useCallback(() => {
    clearTimeout(autoCancelTimeoutRef.current);
  }, []);

  const handleEditFieldBlur = React.useCallback(() => {
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
                <button
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
                >
                  {message}
                </button>
              )}
            </T>

            <T id="save">
              {(message) => (
                <button
                  className={classNames(
                    "mx-1",
                    "px-2 py-1",
                    "rounded overflow-hidden",
                    "text-gray-600 text-sm",
                    "transition ease-in-out duration-200",
                    "hover:bg-black hover:bg-opacity-5",
                    "opacity-75 hover:opacity-100 focus:opacity-100"
                  )}
                >
                  {message}
                </button>
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
        <button
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
        >
          <EditIcon
            className={classNames(
              "-ml-1 mr-1 h-4 w-auto stroke-current stroke-2"
            )}
          />
          <T id="edit" />
        </button>
      )}
    </div>
  );
};

export default EditableTitle;

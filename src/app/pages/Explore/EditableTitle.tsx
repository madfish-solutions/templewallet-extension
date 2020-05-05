import * as React from "react";
import classNames from "clsx";
import { useThanosClient, useAccount } from "lib/thanos/front";
import Name from "app/atoms/Name";
import FormField from "app/atoms/FormField";
import { ReactComponent as EditIcon } from "app/icons/edit.svg";

const EditableTitle: React.FC = () => {
  const { editAccountName } = useThanosClient();
  const account = useAccount();

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

          alert(err.message);
        }
      })();
    },
    [account.name, editAccountName, account.publicKeyHash]
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
    <div className="relative pt-4 flex items-center justify-center">
      {editing ? (
        <form
          className="flex-1 flex flex-col items-center"
          onSubmit={handleEditSubmit}
        >
          <FormField
            ref={editAccNameFieldRef}
            name="name"
            defaultValue={account.name}
            maxLength={16}
            pattern="^[a-zA-Z0-9 _-]{1,16}$"
            title="1-16 characters, no special"
            spellCheck={false}
            className={classNames(
              "w-full mx-auto max-w-xs",
              "text-2xl font-light text-gray-700 text-center"
            )}
            style={{ padding: "0.075rem 0" }}
            onFocus={handleEditFieldFocus}
            onBlur={handleEditFieldBlur}
          />

          <div className="mb-2 flex items-stretch">
            <button
              type="button"
              className={classNames(
                "mx-1",
                "px-2 py-1",
                "rounded overflow-hidden",
                "text-gray-600 text-sm",
                "transition ease-in-out duration-200",
                "hover:bg-black-5",
                "opacity-75 hover:opacity-100 focus:opacity-100"
              )}
              onClick={handleCancelClick}
            >
              Cancel
            </button>

            <button
              className={classNames(
                "mx-1",
                "px-2 py-1",
                "rounded overflow-hidden",
                "text-gray-600 text-sm",
                "transition ease-in-out duration-200",
                "hover:bg-black-5",
                "opacity-75 hover:opacity-100 focus:opacity-100"
              )}
            >
              Save
            </button>
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
            "hover:bg-black-5",
            "opacity-75 hover:opacity-100 focus:opacity-100"
          )}
          onClick={handleEditClick}
        >
          <EditIcon
            className={classNames(
              "-ml-1 mr-1 h-4 w-auto stroke-current stroke-2"
            )}
          />
          Edit
        </button>
      )}
    </div>
  );
};

export default EditableTitle;

import * as React from "react";
import classNames from "clsx";
import {
  useStorage,
  ThanosSharedStorageKey,
  useThanosClient,
} from "lib/thanos/front";
import { T } from "lib/ui/i18n";
import { ThanosDAppSession } from "lib/thanos/types";
import { useRetryableSWR } from "lib/swr";
import DAppLogo from "app/templates/DAppLogo";
import FormCheckbox from "app/atoms/FormCheckbox";
import { ReactComponent as CloseIcon } from "app/icons/close.svg";
import CustomSelect, { OptionRenderProps } from "app/templates/CustomSelect";
import Name from "app/atoms/Name";
import HashChip from "app/atoms/HashChip";

type DAppEntry = [string, ThanosDAppSession];
type DAppActions = {
  remove: (origin: string) => void;
};

const getDAppKey = (entry: DAppEntry) => entry[0];

const DAppSettings: React.FC = () => {
  const [dAppEnabled, setDAppEnabled] = useStorage(
    ThanosSharedStorageKey.DAppEnabled,
    true
  );
  const { getAllDAppSessions, removeDAppSession } = useThanosClient();
  const { data } = useRetryableSWR<Record<string, ThanosDAppSession>>(
    ["getAllDAppSessions"],
    getAllDAppSessions,
    {
      suspense: true,
      shouldRetryOnError: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
  const dAppSessions = data!;

  const changingRef = React.useRef(false);
  const [error, setError] = React.useState<any>(null);

  const handleChange = React.useCallback(
    async (evt) => {
      if (changingRef.current) return;
      changingRef.current = true;
      setError(null);

      try {
        setDAppEnabled(evt.target.checked);
      } catch (err) {
        setError(err);
      }

      changingRef.current = false;
    },
    [setError, setDAppEnabled]
  );

  const handleRemoveClick = React.useCallback(
    (origin: string) => {
      if (window.confirm("Are you sure you want to reset permissions?")) {
        removeDAppSession(origin);
      }
    },
    [removeDAppSession]
  );

  const dAppEntries = Object.entries(dAppSessions);

  return (
    <div className="my-8 w-full mx-auto max-w-sm">
      <h2
        className={classNames("w-full mb-4", "leading-tight", "flex flex-col")}
      >
        <span
          className={classNames("text-xs font-light text-gray-600")}
          style={{ maxWidth: "90%" }}
        >
          Click on the checkmark to {dAppEnabled ? "disable" : "enable"} DApps
          interaction feature. It’s still in Alpha, but it can be used for
          testing and development purposes.
        </span>
      </h2>

      <FormCheckbox
        checked={dAppEnabled}
        onChange={handleChange}
        name="dAppEnabled"
        label={dAppEnabled ? "Enabled" : "Disabled"}
        labelDescription="DApps interaction"
        errorCaption={error?.message}
        containerClassName="mb-4"
      />

      {dAppEntries.length > 0 && (
        <>
          <h2>
            <T name="authorizedDApps">
              {(message) => (
                <span className="text-base font-semibold text-gray-700">
                  {message}
                </span>
              )}
            </T>
          </h2>

          <div className="mb-4">
            <T name="clickIconToResetPermissions">
              {(message) => (
                <span
                  className="text-xs font-light text-gray-600"
                  style={{ maxWidth: "90%" }}
                >
                  {message}
                </span>
              )}
            </T>
          </div>

          <CustomSelect
            actions={{ remove: handleRemoveClick }}
            className="mb-6"
            getItemId={getDAppKey}
            items={dAppEntries}
            OptionIcon={DAppIcon}
            OptionContent={DAppDescription}
          />
        </>
      )}
    </div>
  );
};

export default DAppSettings;

const DAppIcon: React.FC<OptionRenderProps<DAppEntry, string, DAppActions>> = (
  props
) => <DAppLogo className="flex-none ml-2" origin={props.item[0]} size={20} />;

const DAppDescription: React.FC<OptionRenderProps<
  DAppEntry,
  string,
  DAppActions
>> = (props) => {
  const {
    actions,
    item: [origin, session],
  } = props;
  const { remove: onRemove } = actions!;

  const handleRemoveClick = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.stopPropagation();
      onRemove(origin);
    },
    [onRemove, origin]
  );

  return (
    <div className="w-full flex flex-1">
      <div className="flex flex-col justify-between flex-1">
        <Name className="text-sm font-medium leading-tight text-left">
          {session.appMeta.name}
        </Name>

        <div className="text-gray-600">Network: {session.network}</div>

        <div
          className="text-gray-600 overflow-hidden w-48 whitespace-no-wrap"
          style={{ textOverflow: "ellipsis" }}
        >
          PKH: <HashChip hash={session.pkh} small />
        </div>
      </div>

      <button className="flex-none" onClick={handleRemoveClick}>
        <CloseIcon
          className="w-auto h-5 mx-2 stroke-2"
          stroke="#777"
          title="Delete"
        />
      </button>
    </div>
  );
};

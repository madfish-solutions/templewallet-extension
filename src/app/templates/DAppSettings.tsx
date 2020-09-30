import * as React from "react";
import classNames from "clsx";
import {
  useStorage,
  ThanosSharedStorageKey,
  useThanosClient,
} from "lib/thanos/front";
import { ThanosDAppSession, ThanosDAppSessions } from "lib/thanos/types";
import { t, T } from "lib/ui/i18n";
import { useRetryableSWR } from "lib/swr";
import DAppLogo from "app/templates/DAppLogo";
import FormCheckbox from "app/atoms/FormCheckbox";
import { ReactComponent as CloseIcon } from "app/icons/close.svg";
import CustomSelect, { OptionRenderProps } from "app/templates/CustomSelect";
import Name from "app/atoms/Name";

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
  const { data, revalidate } = useRetryableSWR<ThanosDAppSessions>(
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
    async (origin: string) => {
      if (window.confirm(t("resetPermissionsConfirmation", origin))) {
        await removeDAppSession(origin);
        revalidate();
      }
    },
    [removeDAppSession, revalidate]
  );

  const dAppEntries = React.useMemo(() => Object.entries(dAppSessions), [
    dAppSessions,
  ]);

  return (
    <div className="w-full max-w-sm mx-auto my-8">
      <h2
        className={classNames("w-full mb-4", "leading-tight", "flex flex-col")}
      >
        <T
          name="dAppsCheckmarkPrompt"
          substitutions={t(dAppEnabled ? "disable" : "enable")}
        >
          {(message) => (
            <span
              className={classNames("text-xs font-light text-gray-600")}
              style={{ maxWidth: "90%" }}
            >
              {message}
            </span>
          )}
        </T>
      </h2>

      <FormCheckbox
        checked={dAppEnabled}
        onChange={handleChange}
        name="dAppEnabled"
        label={t(
          dAppEnabled ? "dAppsInteractionEnabled" : "dAppsInteractionDisabled"
        )}
        labelDescription={t("dAppsInteraction")}
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
) => (
  <DAppLogo className="flex-none ml-2 mr-1" origin={props.item[0]} size={36} />
);

const DAppDescription: React.FC<OptionRenderProps<
  DAppEntry,
  string,
  DAppActions
>> = (props) => {
  const {
    actions,
    item: [origin, { appMeta, network, pkh }],
  } = props;
  const { remove: onRemove } = actions!;

  const handleRemoveClick = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.stopPropagation();
      onRemove(origin);
    },
    [onRemove, origin]
  );

  const pkhPreviewNode = React.useMemo(() => {
    const val = pkh;
    const ln = val.length;
    return (
      <>
        {val.slice(0, 7)}
        <span className="opacity-75">...</span>
        {val.slice(ln - 4, ln)}
      </>
    );
  }, [pkh]);

  return (
    <div className="flex flex-1 w-full">
      <div className="flex flex-col justify-between flex-1">
        <Name className="text-sm font-medium leading-tight text-left">
          {appMeta.name}
        </Name>

        <T
          name="networkLabel"
          substitutions={typeof network === "object" ? network.name : network}
        >
          {(message) => <div className="text-gray-600">{message}</div>}
        </T>

        <T name="pkhLabel" substitutions={[pkhPreviewNode]}>
          {(message) => (
            <div
              className="text-gray-600 overflow-hidden whitespace-no-wrap"
              style={{ textOverflow: "ellipsis" }}
            >
              {message}
            </div>
          )}
        </T>
      </div>

      <button className="flex-none" onClick={handleRemoveClick}>
        <CloseIcon
          className="w-auto h-5 mx-2 stroke-2"
          stroke="#777"
          title={t("delete")}
        />
      </button>
    </div>
  );
};

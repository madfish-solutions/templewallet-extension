import React, { ComponentProps, FC, useCallback, useMemo, useRef, useState } from "react";

import classNames from "clsx";

import FormCheckbox from "app/atoms/FormCheckbox";
import Name from "app/atoms/Name";
import { ReactComponent as CloseIcon } from "app/icons/close.svg";
import CustomSelect, { OptionRenderProps } from "app/templates/CustomSelect";
import DAppLogo from "app/templates/DAppLogo";
import HashChip from "app/templates/HashChip";
import { T, t } from "lib/i18n/react";
import { useRetryableSWR } from "lib/swr";
import {
  useStorage,
  TempleSharedStorageKey,
  useTempleClient,
} from "lib/temple/front";
import { TempleDAppSession, TempleDAppSessions } from "lib/temple/types";
import { useConfirm } from "lib/ui/dialog";

type DAppEntry = [string, TempleDAppSession];
type DAppActions = {
  remove: (origin: string) => void;
};

const getDAppKey = (entry: DAppEntry) => entry[0];

const DAppSettings: FC = () => {
  const { getAllDAppSessions, removeDAppSession } = useTempleClient();
  const confirm = useConfirm();

  const { data, revalidate } = useRetryableSWR<TempleDAppSessions>(
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

  const [dAppEnabled, setDAppEnabled] = useStorage(
    TempleSharedStorageKey.DAppEnabled,
    true
  );

  const changingRef = useRef(false);
  const [error, setError] = useState<any>(null);

  const handleChange = useCallback(
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

  const handleRemoveClick = useCallback(
    async (origin: string) => {
      if (
        await confirm({
          title: t("actionConfirmation"),
          children: t("resetPermissionsConfirmation", origin),
        })
      ) {
        await removeDAppSession(origin);
        revalidate();
      }
    },
    [removeDAppSession, revalidate, confirm]
  );

  const dAppEntries = useMemo(() => Object.entries(dAppSessions), [
    dAppSessions,
  ]);

  return (
    <div className="w-full max-w-sm mx-auto my-8">
      <h2
        className={classNames("w-full mb-4", "leading-tight", "flex flex-col")}
      >
        <T
          id="dAppsCheckmarkPrompt"
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
            <T id="authorizedDApps">
              {(message) => (
                <span className="text-base font-semibold text-gray-700">
                  {message}
                </span>
              )}
            </T>
          </h2>

          <div className="mb-4">
            <T id="clickIconToResetPermissions">
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
            light
            hoverable={false}
          />
        </>
      )}
    </div>
  );
};

export default DAppSettings;

const DAppIcon: FC<OptionRenderProps<DAppEntry, string, DAppActions>> = (
  props
) => (
  <DAppLogo
    className="flex-none ml-2 mr-1 my-1"
    style={{ alignSelf: "flex-start" }}
    origin={props.item[0]}
    size={36}
  />
);

const DAppDescription: FC<
  OptionRenderProps<DAppEntry, string, DAppActions>
> = (props) => {
  const {
    actions,
    item: [origin, { appMeta, network, pkh }],
  } = props;
  const { remove: onRemove } = actions!;

  const handleRemoveClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.stopPropagation();
      onRemove(origin);
    },
    [onRemove, origin]
  );

  const dAppAttributes = useMemo(
    () => [
      {
        key: "originLabel",
        value: origin,
        Component: ({
          className,
          ...rest
        }: ComponentProps<typeof Name>) => (
          <a
            href={origin}
            target="_blank"
            rel="noopener noreferrer"
            className={classNames("text-blue-700 hover:underline", className)}
          >
            <Name {...rest} />
          </a>
        ),
      },
      {
        key: "networkLabel",
        value:
          typeof network === "string" ? network : network.name || network.rpc,
        valueClassName:
          (typeof network === "string" || network.name) && "capitalize",
        Component: Name,
      },
      {
        key: "pkhLabel",
        value: <HashChip hash={pkh} type="link" small />,
        Component: "span",
      },
    ],
    [origin, network, pkh]
  );

  return (
    <div className="flex flex-1 w-full">
      <div className="flex flex-col justify-between flex-1">
        <Name className="mb-1 text-sm font-medium leading-tight text-left">
          {appMeta.name}
        </Name>

        {dAppAttributes.map(({ key, value, valueClassName, Component }) => (
          <div
            className="text-xs font-light leading-tight text-gray-600"
            key={key}
          >
            <T
              id={key}
              substitutions={[
                <Component
                  key={key}
                  className={classNames(
                    "font-normal text-sm inline-flex",
                    valueClassName
                  )}
                  style={{ maxWidth: "10rem" }}
                >
                  {value}
                </Component>,
              ]}
            />
          </div>
        ))}
      </div>

      <button
        className={classNames(
          "flex-none p-2",
          "text-gray-500 hover:text-gray-600",
          "transition ease-in-out duration-200"
        )}
        onClick={handleRemoveClick}
      >
        <CloseIcon
          className="w-auto h-5 stroke-current stroke-2"
          title={t("delete")}
        />
      </button>
    </div>
  );
};

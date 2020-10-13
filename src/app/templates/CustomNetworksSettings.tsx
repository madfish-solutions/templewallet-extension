import classNames from "clsx";
import React, { useCallback } from "react";
import { useForm } from "react-hook-form";
import { ThanosNetwork, useSettings, useThanosClient } from "lib/thanos/front";
import { COLORS } from "lib/ui/colors";
import { T, useTranslation } from "lib/ui/i18n";
import { ReactComponent as CloseIcon } from "app/icons/close.svg";
import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import Name from "app/atoms/Name";
import { NETWORKS } from "lib/thanos/networks";

type FormData = Pick<ThanosNetwork, "name" | "rpcBaseURL">;

const SUBMIT_ERROR_TYPE = "submit-error";
const URL_PATTERN = /^((?:http(s)?:\/\/)?[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=.]+)|(http(s)?:\/\/localhost:[0-9]+)$/;

const CustomNetworksSettings: React.FC = () => {
  const { updateSettings } = useThanosClient();
  const { customNetworks = [] } = useSettings();
  const { t } = useTranslation();

  const {
    register,
    reset: resetForm,
    handleSubmit,
    formState,
    clearError,
    setError,
    errors,
  } = useForm<FormData>();
  const submitting = formState.isSubmitting;

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (submitting) return;
      clearError();

      try {
        await updateSettings({
          customNetworks: [
            ...customNetworks,
            {
              ...data,
              description: data.name,
              type: "test",
              disabled: false,
              color: COLORS[Math.floor(Math.random() * COLORS.length)],
              id: data.rpcBaseURL,
            },
          ],
        });
        resetForm();
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }
        await new Promise((res) => setTimeout(res, 300));
        setError("rpcBaseURL", SUBMIT_ERROR_TYPE, err.message);
      }
    },
    [
      clearError,
      customNetworks,
      resetForm,
      submitting,
      setError,
      updateSettings,
    ]
  );

  const rpcURLIsUnique = useCallback(
    (url: string) => {
      return ![...NETWORKS, ...customNetworks].some(
        ({ rpcBaseURL }) => rpcBaseURL === url
      );
    },
    [customNetworks]
  );

  const handleRemoveClick = useCallback(
    (baseUrl: string) => {
      if (!window.confirm(t("deleteNetworkConfirm") as string)) {
        return;
      }

      updateSettings({
        customNetworks: customNetworks.filter(
          ({ rpcBaseURL }) => rpcBaseURL !== baseUrl
        ),
      }).catch(async (err) => {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }
        await new Promise((res) => setTimeout(res, 300));
        setError("rpcBaseURL", SUBMIT_ERROR_TYPE, err.message);
      });
    },
    [customNetworks, setError, updateSettings, t]
  );

  return (
    <div className="w-full max-w-sm p-2 pb-4 mx-auto">
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormField
          ref={register({ required: t("required") as string, maxLength: 35 })}
          label={t("name")}
          id="name"
          name="name"
          placeholder={t("networkNamePlaceholder") as string}
          errorCaption={errors.name?.message}
          containerClassName="mb-4"
          maxLength={35}
        />

        <FormField
          ref={register({
            required: t("required") as string,
            pattern: {
              value: URL_PATTERN,
              message: t("mustBeValidURL") as string,
            },
            validate: {
              unique: rpcURLIsUnique,
            },
          })}
          label={t("rpcBaseURL")}
          id="rpc-base-url"
          name="rpcBaseURL"
          placeholder="http://localhost:8545"
          errorCaption={
            errors.rpcBaseURL?.message ||
            (errors.rpcBaseURL?.type === "unique" ? t("mustBeUnique") : "")
          }
          containerClassName="mb-6"
        />

        <T name="addNetwork">
          {(message) => (
            <FormSubmitButton loading={submitting}>{message}</FormSubmitButton>
          )}
        </T>
      </form>

      <div className="flex flex-col my-8">
        <h2 className={classNames("mb-4", "leading-tight", "flex flex-col")}>
          <T name="currentNetworks">
            {(message) => (
              <span className="text-base font-semibold text-gray-700">
                {message}
              </span>
            )}
          </T>

          <T name="deleteNetworkHint">
            {(message) => (
              <span
                className={classNames(
                  "mt-1",
                  "text-xs font-light text-gray-600"
                )}
                style={{ maxWidth: "90%" }}
              >
                {message}
              </span>
            )}
          </T>
        </h2>

        <div
          className={classNames(
            "rounded-md overflow-hidden",
            "border-2 bg-gray-100",
            "flex flex-col",
            "text-gray-700 text-sm leading-tight"
          )}
        >
          {customNetworks.map((network) => (
            <NetworksListItem
              canRemove
              network={network}
              last={false}
              key={network.rpcBaseURL}
              onRemoveClick={handleRemoveClick}
            />
          ))}
          {NETWORKS.map((network, index) => (
            <NetworksListItem
              canRemove={false}
              key={network.rpcBaseURL}
              last={index === NETWORKS.length - 1}
              network={network}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomNetworksSettings;

type NetworksListItemProps = {
  canRemove: boolean;
  network: ThanosNetwork;
  onRemoveClick?: (baseUrl: string) => void;
  last: boolean;
};

const NetworksListItem: React.FC<NetworksListItemProps> = (props) => {
  const {
    network: { name, rpcBaseURL, color },
    canRemove,
    onRemoveClick,
    last,
  } = props;
  const handleRemoveClick = useCallback(() => onRemoveClick?.(rpcBaseURL), [
    onRemoveClick,
    rpcBaseURL,
  ]);
  const { t } = useTranslation();

  return (
    <div
      className={classNames(
        "block w-full",
        "overflow-hidden",
        !last && "border-b border-gray-200",
        "hover:bg-gray-200 focus:bg-gray-200",
        "flex items-center",
        "text-gray-700",
        "transition ease-in-out duration-200",
        "focus:outline-none",
        "opacity-90 hover:opacity-100"
      )}
      style={{
        padding: "0.4rem 0.375rem 0.4rem 0.375rem",
      }}
    >
      <div
        className="w-3 h-3 ml-1 mr-3 border rounded-full shadow-xs border-primary-white"
        style={{ background: color }}
      />
      <div className="flex flex-col justify-between flex-1">
        <Name className="text-sm font-medium leading-tight">{name}</Name>
        <div className="mt-1 text-xs leading-none text-gray-700">
          {rpcBaseURL}
        </div>
      </div>
      {canRemove && (
        <button className="flex-none" onClick={handleRemoveClick}>
          <CloseIcon
            className="w-auto h-5 mx-2 stroke-2"
            stroke="#777"
            title={t("delete") as string}
          />
        </button>
      )}
    </div>
  );
};

import classNames from "clsx";
import React, { useCallback } from "react";
import { useForm } from "react-hook-form";
import { ThanosNetwork, useSettings, useThanosClient } from "lib/thanos/front";
import { COLORS } from "lib/ui/colors";
import { ReactComponent as CloseIcon } from "app/icons/close.svg";
import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import Name from "app/atoms/Name";

type FormData = Pick<ThanosNetwork, "name" | "rpcBaseURL">;

interface NetworksListItemProps extends ThanosNetwork {
  onRemoveClick: (baseUrl: string) => void;
  last: boolean;
}

const SUBMIT_ERROR_TYPE = "submit-error";
const URL_PATTERN = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=.]+$/;

const CustomNetworksSettings: React.FC = () => {
  const { updateSettings } = useThanosClient();
  const { customNetworks = [] } = useSettings();

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
              tzStats: null,
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

  const handleRemoveClick = useCallback(
    (baseUrl: string) => {
      if (!window.confirm("Are you sure you want to delete this network?")) {
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
    [customNetworks, setError, updateSettings]
  );

  return (
    <div className="w-full max-w-sm p-2 pb-4 mx-auto">
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormField
          ref={register({ required: "Required", maxLength: 35 })}
          label="Name of network"
          id="name-of-network"
          name="name"
          placeholder="My network"
          errorCaption={errors.name?.message}
          containerClassName="mb-4"
          maxLength={35}
        />

        <FormField
          ref={register({
            required: "Required",
            pattern: { value: URL_PATTERN, message: "Must be a valid URL" },
            validate: {
              unique: (url: string) =>
                !customNetworks.some(({ rpcBaseURL }) => rpcBaseURL === url),
            },
          })}
          label="RPC URL"
          id="rpc-base-url"
          name="rpcBaseURL"
          placeholder="http://localhost:8545"
          errorCaption={
            errors.rpcBaseURL?.message ||
            (errors.rpcBaseURL?.type === "unique" ? "Must be unique" : "")
          }
          containerClassName="mb-6"
        />

        <FormSubmitButton loading={submitting} disabled={submitting}>
          Add network
        </FormSubmitButton>
      </form>

      {customNetworks.length > 0 ? (
        <div className="rounded-md overflow-hidden border-2 bg-gray-100 flex flex-col text-gray-700 text-sm leading-tight mt-8">
          {customNetworks.map((network, index) => (
            <NetworksListItem
              {...network}
              last={index === customNetworks.length - 1}
              key={network.rpcBaseURL}
              onRemoveClick={handleRemoveClick}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default CustomNetworksSettings;

const NetworksListItem = (props: NetworksListItemProps) => {
  const { name, rpcBaseURL, color, onRemoveClick, last } = props;
  const handleRemoveClick = useCallback(() => onRemoveClick(rpcBaseURL), [
    onRemoveClick,
    rpcBaseURL,
  ]);

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
        className="ml-1 mr-3 w-3 h-3 border border-primary-white rounded-full shadow-xs"
        style={{ background: color }}
      />
      <div className="flex-1 flex flex-col justify-between">
        <Name className="text-sm font-medium leading-tight">{name}</Name>
        <div className="text-xs leading-none text-gray-700 mt-1">
          {rpcBaseURL}
        </div>
      </div>
      <button className="flex-none" onClick={handleRemoveClick}>
        <CloseIcon
          className="mx-2 h-5 w-auto stroke-2"
          stroke="#777"
          title="Delete"
        />
      </button>
    </div>
  );
};

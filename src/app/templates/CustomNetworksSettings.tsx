import React, { useCallback, useState } from "react";
import classNames from "clsx";
import { useForm } from "react-hook-form";
import { ThanosNetwork, useSettings, useThanosClient } from "lib/thanos/front";
import { COLORS } from "lib/ui/colors";
import { ReactComponent as CloseIcon } from "app/icons/close.svg";
import FormField from "app/atoms/FormField";
import FormSecondaryButton from "app/atoms/FormSecondaryButton";
import FormSubmitButton from "app/atoms/FormSubmitButton";

type FormData = Pick<ThanosNetwork, "name" | "rpcBaseURL">;

const SUBMIT_ERROR_TYPE = "submit-error";
const URL_PATTERN = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=.]+$/;

const CustomNetworksSettings: React.FC = () => {
  const { updateSettings } = useThanosClient();
  const { customNetworks = [] } = useSettings();

  const [formVisible, setFormVisible] = useState(false);
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

  const showForm = useCallback(() => setFormVisible(true), []);
  const hideForm = useCallback(() => {
    setFormVisible(false);
    resetForm();
  }, [resetForm]);

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
        hideForm();
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }
        await new Promise((res) => setTimeout(res, 300));
        setError("rpcBaseURL", SUBMIT_ERROR_TYPE, err.message);
      }
    },
    [clearError, customNetworks, hideForm, submitting, setError, updateSettings]
  );

  const handleRemoveClick = useCallback(
    (baseUrl: string) => {
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
    <div className="w-full max-w-sm p-2 mx-auto">
      <div className="flex flex-col items-center">
        {customNetworks.length > 0 ? (
          customNetworks.map((network) => (
            <NetworksListItem
              {...network}
              key={network.rpcBaseURL}
              onRemoveClick={handleRemoveClick}
            />
          ))
        ) : (
          <span>There are no custom networks</span>
        )}
        <FormSecondaryButton
          className={classNames(formVisible && "hidden", "mt-6")}
          onClick={showForm}
        >
          Add network
        </FormSecondaryButton>
      </div>

      <form
        className={classNames(!formVisible && "hidden")}
        onSubmit={handleSubmit(onSubmit)}
      >
        <FormField
          ref={register({ required: "Required" })}
          label="Name of network"
          id="name-of-network"
          name="name"
          placeholder="My network"
          errorCaption={errors.name?.message}
          containerClassName="mb-4"
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
          containerClassName="mb-4"
        />

        <div className="flex">
          <div className="flex-1 mr-4">
            <FormSubmitButton
              className="w-full h-full justify-center"
              loading={submitting}
              disabled={submitting}
            >
              Add network
            </FormSubmitButton>
          </div>
          <div className="flex-1">
            <FormSecondaryButton
              className="w-full h-full justify-center"
              onClick={hideForm}
            >
              Cancel
            </FormSecondaryButton>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CustomNetworksSettings;

const NetworksListItem = (
  props: ThanosNetwork & { onRemoveClick: (baseUrl: string) => void }
) => {
  const { name, rpcBaseURL, color, onRemoveClick } = props;
  const handleRemoveClick = useCallback(() => onRemoveClick(rpcBaseURL), [
    onRemoveClick,
    rpcBaseURL,
  ]);

  return (
    <div className="flex my-2 items-center w-full">
      <div
        className="flex-none mr-3 rounded w-3 h-3"
        style={{ background: color }}
      />
      <div className="flex-1 text-base text-gray-800">{name}</div>
      <button
        className="flex-none rounded-full bg-red-600"
        onClick={handleRemoveClick}
      >
        <CloseIcon className="h-4 w-auto" title="Delete" />
      </button>
    </div>
  );
};

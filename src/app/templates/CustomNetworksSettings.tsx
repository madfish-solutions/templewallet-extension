import classNames from "clsx";
import React, { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import {
  ThanosNetwork,
  useNetwork,
  useSettings,
  useTezos,
  useThanosClient,
  validateContractAddress,
} from "lib/thanos/front";
import { COLORS } from "lib/ui/colors";
import { withErrorHumanDelay } from "lib/ui/humanDelay";
import { T, t } from "lib/i18n/react";
import { viewLambda } from "lib/michelson";
import { ReactComponent as CloseIcon } from "app/icons/close.svg";
import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import Name from "app/atoms/Name";
import HashShortView from "app/atoms/HashShortView";
import Alert from "app/atoms/Alert";
import FormSecondaryButton from "app/atoms/FormSecondaryButton";

type NetworkFormData = Pick<
  ThanosNetwork,
  "name" | "rpcBaseURL" | "lambdaContract"
>;
type LambdaFormData = {
  lambdaContract: NonNullable<ThanosNetwork["lambdaContract"]>;
};

const SUBMIT_ERROR_TYPE = "submit-error";
const URL_PATTERN = /^((?:http(s)?:\/\/)?[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=.]+)|(http(s)?:\/\/localhost:[0-9]+)$/;

const CustomNetworksSettings: React.FC = () => {
  const { updateSettings, customNetworks, defaultNetworks } = useThanosClient();
  const { lambdaContracts = {} } = useSettings();
  const network = useNetwork();
  const [showNoLambdaWarning, setShowNoLambdaWarning] = useState(false);
  const tezos = useTezos();

  const {
    register: networkFormRegister,
    reset: resetNetworkForm,
    handleSubmit: handleNetworkFormSubmit,
    formState: networkFormState,
    clearError: clearNetworkFormError,
    setError: setNetworkFormError,
    errors: networkFormErrors,
  } = useForm<NetworkFormData>();
  const networkFormSubmitting = networkFormState.isSubmitting;
  const {
    register: lambdaFormRegister,
    reset: resetLambdaForm,
    handleSubmit: handleLambdaFormSubmit,
    formState: lambdaFormState,
    clearError: clearLambdaFormError,
    setError: setLambdaFormError,
    errors: lambdaFormErrors,
  } = useForm<LambdaFormData>();
  const lambdaFormSubmitting = lambdaFormState.isSubmitting;
  const [lambdaContractDeploying, setLambdaContractDeploying] = useState(false);
  const [lambdaDeploymentError, setLambdaDeploymentError] = useState<Error>();
  const lambdaFormLoading = lambdaFormSubmitting || lambdaContractDeploying;

  const onNetworkFormSubmit = useCallback(
    async ({ rpcBaseURL, name, lambdaContract }: NetworkFormData) => {
      if (networkFormSubmitting) return;
      clearNetworkFormError();

      if (!showNoLambdaWarning && !lambdaContract) {
        setShowNoLambdaWarning(true);
        return;
      }
      setShowNoLambdaWarning(false);

      try {
        await updateSettings({
          customNetworks: [
            ...customNetworks,
            {
              rpcBaseURL,
              name,
              description: name,
              type: "test",
              disabled: false,
              color: COLORS[Math.floor(Math.random() * COLORS.length)],
              id: rpcBaseURL,
            },
          ],
          lambdaContracts: lambdaContract
            ? {
                ...lambdaContracts,
                [rpcBaseURL]: lambdaContract,
              }
            : lambdaContracts,
        });
        resetNetworkForm();
      } catch (err) {
        await withErrorHumanDelay(err, () =>
          setNetworkFormError("rpcBaseURL", SUBMIT_ERROR_TYPE, err.message)
        );
      }
    },
    [
      clearNetworkFormError,
      customNetworks,
      lambdaContracts,
      resetNetworkForm,
      networkFormSubmitting,
      setNetworkFormError,
      updateSettings,
      showNoLambdaWarning,
    ]
  );

  const onLambdaFormSubmit = useCallback(
    async (data: LambdaFormData) => {
      if (lambdaFormLoading) {
        return;
      }
      clearLambdaFormError();
      try {
        await updateSettings({
          lambdaContracts: {
            ...lambdaContracts,
            [network.id]: data.lambdaContract,
          },
        });
        resetLambdaForm();
      } catch (err) {
        await withErrorHumanDelay(err, () =>
          setLambdaFormError("lambdaContract", SUBMIT_ERROR_TYPE, err.message)
        );
      }
    },
    [
      clearLambdaFormError,
      lambdaContracts,
      lambdaFormLoading,
      network.id,
      resetLambdaForm,
      setLambdaFormError,
      updateSettings,
    ]
  );

  const onLambdaDeployClick = useCallback(async () => {
    if (lambdaFormLoading) {
      return;
    }
    setLambdaContractDeploying(true);
    setLambdaDeploymentError(undefined);
    try {
      const op = await tezos.wallet
        .originate({
          balance: "0",
          code: viewLambda,
          init: { unit: null },
        })
        .send();
      const contract = await op.contract();
      await updateSettings({
        lambdaContracts: {
          ...lambdaContracts,
          [network.id]: contract.address,
        },
      });
    } catch (err) {
      await withErrorHumanDelay(err, () => setLambdaDeploymentError(err));
    } finally {
      setLambdaContractDeploying(false);
    }
  }, [lambdaFormLoading, lambdaContracts, network.id, tezos, updateSettings]);

  const rpcURLIsUnique = useCallback(
    (url: string) => {
      return ![...defaultNetworks, ...customNetworks].some(
        ({ rpcBaseURL }) => rpcBaseURL === url
      );
    },
    [customNetworks, defaultNetworks]
  );

  const handleRemoveClick = useCallback(
    (baseUrl: string) => {
      if (!window.confirm(t("deleteNetworkConfirm"))) {
        return;
      }

      const {
        [baseUrl]: lambdaToRemove,
        ...restLambdaContracts
      } = lambdaContracts;
      updateSettings({
        customNetworks: customNetworks.filter(
          ({ rpcBaseURL }) => rpcBaseURL !== baseUrl
        ),
        lambdaContracts: restLambdaContracts,
      }).catch(async (err) => {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }
        await new Promise((res) => setTimeout(res, 300));
        setNetworkFormError("rpcBaseURL", SUBMIT_ERROR_TYPE, err.message);
      });
    },
    [customNetworks, setNetworkFormError, updateSettings, lambdaContracts]
  );

  return (
    <div className="w-full max-w-sm p-2 pb-4 mx-auto">
      {!network.lambdaContract && (
        <>
          <Alert
            className="mb-4"
            title={t("attentionExclamation")}
            description={t("noActiveNetLambdaWarningContent")}
          />
          {lambdaDeploymentError && (
            <Alert
              className="mb-4"
              type="error"
              title={t("error")}
              description={lambdaDeploymentError.message}
            />
          )}
          <form onSubmit={handleLambdaFormSubmit(onLambdaFormSubmit)}>
            <FormField
              ref={lambdaFormRegister({
                validate: validateLambdaContract,
                required: true,
              })}
              label={t("lambdaContract")}
              id="current-network-lambda-contract"
              name="lambdaContract"
              placeholder={t("lambdaContractPlaceholder")}
              errorCaption={lambdaFormErrors.lambdaContract?.message}
              containerClassName="mb-6"
            />
            <div className="flex justify-between">
              <FormSubmitButton loading={lambdaFormLoading}>
                <T id="add" />
              </FormSubmitButton>

              <FormSecondaryButton
                loading={lambdaFormLoading}
                onClick={onLambdaDeployClick}
              >
                <T id="deployNew" />
              </FormSecondaryButton>
            </div>
          </form>
          <div className="my-4 w-full h-px bg-gray-200" />
        </>
      )}
      <form onSubmit={handleNetworkFormSubmit(onNetworkFormSubmit)}>
        <FormField
          ref={networkFormRegister({ required: t("required"), maxLength: 35 })}
          label={t("name")}
          id="name"
          name="name"
          placeholder={t("networkNamePlaceholder")}
          errorCaption={networkFormErrors.name?.message}
          containerClassName="mb-4"
          maxLength={35}
        />

        <FormField
          ref={networkFormRegister({
            required: t("required"),
            pattern: {
              value: URL_PATTERN,
              message: t("mustBeValidURL"),
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
            networkFormErrors.rpcBaseURL?.message ||
            (networkFormErrors.rpcBaseURL?.type === "unique"
              ? t("mustBeUnique")
              : "")
          }
          containerClassName="mb-4"
        />

        <FormField
          ref={networkFormRegister({ validate: validateLambdaContract })}
          label={
            <>
              <T id="lambdaContract" />
              <T id="optionalComment">
                {(message) => (
                  <span className="ml-1 text-sm font-light text-gray-600">
                    {message}
                  </span>
                )}
              </T>
            </>
          }
          id="lambda-contract"
          name="lambdaContract"
          placeholder={t("lambdaContractPlaceholder")}
          errorCaption={networkFormErrors.lambdaContract?.message}
          containerClassName="mb-6"
        />

        <T id="addNetwork">
          {(message) => (
            <FormSubmitButton loading={networkFormSubmitting}>
              {message}
            </FormSubmitButton>
          )}
        </T>
      </form>

      {showNoLambdaWarning && (
        <Alert
          className="mt-6"
          title={t("attentionExclamation")}
          description={t("noLambdaWarningContent")}
        />
      )}

      <div className="flex flex-col my-8">
        <h2 className={classNames("mb-4", "leading-tight", "flex flex-col")}>
          <T id="currentNetworks">
            {(message) => (
              <span className="text-base font-semibold text-gray-700">
                {message}
              </span>
            )}
          </T>

          <T id="deleteNetworkHint">
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
          {defaultNetworks.map((network, index) => (
            <NetworksListItem
              canRemove={false}
              key={network.rpcBaseURL}
              last={index === defaultNetworks.length - 1}
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
    network: { name, nameI18nKey, rpcBaseURL, color, lambdaContract },
    canRemove,
    onRemoveClick,
    last,
  } = props;
  const handleRemoveClick = useCallback(() => onRemoveClick?.(rpcBaseURL), [
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
        className="w-3 h-3 ml-1 mr-3 border rounded-full shadow-xs border-primary-white"
        style={{ background: color }}
      />
      <div className="flex flex-col justify-between flex-1">
        <Name className="text-sm font-medium leading-tight">
          {(nameI18nKey && <T id={nameI18nKey} />) || name}
        </Name>
        <div className="mt-1 text-xs leading-none text-gray-700">
          {rpcBaseURL}
        </div>
        {lambdaContract && (
          <div className="mt-1 text-xs leading-none text-gray-700">
            <T
              id="someLambda"
              substitutions={<HashShortView hash={lambdaContract} />}
            />
          </div>
        )}
      </div>
      {canRemove && (
        <button className="flex-none" onClick={handleRemoveClick}>
          <CloseIcon
            className="w-auto h-5 mx-2 stroke-2"
            stroke="#777"
            title={t("delete")}
          />
        </button>
      )}
    </div>
  );
};

function validateLambdaContract(value: any) {
  return value ? validateContractAddress(value) : true;
}

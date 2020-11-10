import classNames from "clsx";
import React, { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import {
  isKnownChainId,
  loadChainId,
  ThanosChainId,
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
import { URL_PATTERN } from "app/defaults";
import { viewLambda } from "lib/michelson";
import { ReactComponent as CloseIcon } from "app/icons/close.svg";
import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import Name from "app/atoms/Name";
import HashShortView from "app/atoms/HashShortView";
import Alert from "app/atoms/Alert";
import SubTitle from "app/atoms/SubTitle";
import FormSecondaryButton from "app/atoms/FormSecondaryButton";

type NetworkFormData = Pick<
  ThanosNetwork,
  "name" | "rpcBaseURL" | "lambdaContract"
>;
type LambdaFormData = {
  lambdaContract: NonNullable<ThanosNetwork["lambdaContract"]>;
};

const SUBMIT_ERROR_TYPE = "submit-error";
const KNOWN_LAMBDA_CONTRACTS = new Map([
  [ThanosChainId.Mainnet, "KT1CPuTzwC7h7uLXd5WQmpMFso1HxrLBUtpE"],
  [ThanosChainId.Carthagenet, "KT1PCtQTdgD44WsYgTzAUUztMcrDmPiSuSV1"],
  [ThanosChainId.Delphinet, "KT1EC1oaF3LwjiPto3fpUZiS3sWYuQHGxqXM"],
]);

const CustomNetworksSettings: React.FC = () => {
  const { updateSettings, customNetworks, defaultNetworks } = useThanosClient();
  const { lambdaContracts = {} } = useSettings();
  const network = useNetwork();
  const [showNoLambdaWarning, setShowNoLambdaWarning] = useState(false);

  const {
    register,
    reset: resetForm,
    handleSubmit,
    formState,
    clearError,
    setError,
    errors,
  } = useForm<NetworkFormData>();
  const submitting = formState.isSubmitting;

  const onNetworkFormSubmit = useCallback(
    async ({ rpcBaseURL, name, lambdaContract }: NetworkFormData) => {
      if (submitting) return;
      clearError();

      if (!lambdaContract) {
        let chainId;
        try {
          chainId = await loadChainId(rpcBaseURL);
        } catch {}

        lambdaContract =
          chainId &&
          (isKnownChainId(chainId)
            ? KNOWN_LAMBDA_CONTRACTS.get(chainId)
            : undefined);
      }

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
              lambdaContract,
            },
          ],
          lambdaContracts: lambdaContract
            ? {
                ...lambdaContracts,
                [rpcBaseURL]: lambdaContract,
              }
            : lambdaContracts,
        });
        resetForm();
      } catch (err) {
        await withErrorHumanDelay(err, () =>
          setError("rpcBaseURL", SUBMIT_ERROR_TYPE, err.message)
        );
      }
    },
    [
      clearError,
      customNetworks,
      lambdaContracts,
      resetForm,
      submitting,
      setError,
      updateSettings,
      showNoLambdaWarning,
    ]
  );

  const rpcURLIsUnique = useCallback(
    (url: string) =>
      ![...defaultNetworks, ...customNetworks].some(
        ({ rpcBaseURL }) => rpcBaseURL === url
      ),
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
        setError("rpcBaseURL", SUBMIT_ERROR_TYPE, err.message);
      });
    },
    [customNetworks, setError, updateSettings, lambdaContracts]
  );

  return (
    <div className="w-full max-w-sm p-2 pb-4 mx-auto">
      {!network.lambdaContract && <LambdaContractSection />}

      <div className="flex flex-col mb-8">
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

      <SubTitle>
        <T id="AddNetwork" />
      </SubTitle>

      <form onSubmit={handleSubmit(onNetworkFormSubmit)}>
        <FormField
          ref={register({ required: t("required"), maxLength: 35 })}
          label={t("name")}
          id="name"
          name="name"
          placeholder={t("networkNamePlaceholder")}
          errorCaption={errors.name?.message}
          containerClassName="mb-4"
          maxLength={35}
        />

        <FormField
          ref={register({
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
            errors.rpcBaseURL?.message ||
            (errors.rpcBaseURL?.type === "unique" ? t("mustBeUnique") : "")
          }
          containerClassName="mb-4"
        />

        <FormField
          ref={register({ validate: validateLambdaContract })}
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
          errorCaption={errors.lambdaContract?.message}
          containerClassName="mb-4"
        />

        {showNoLambdaWarning && (
          <Alert
            className="mb-6"
            title={t("attentionExclamation")}
            description={t("noLambdaWarningContent")}
          />
        )}

        <T id="addNetwork">
          {(message) => (
            <FormSubmitButton loading={submitting}>{message}</FormSubmitButton>
          )}
        </T>
      </form>
    </div>
  );
};

export default CustomNetworksSettings;

const LambdaContractSection: React.FC = () => {
  const { updateSettings } = useThanosClient();
  const tezos = useTezos();
  const network = useNetwork();
  const { lambdaContracts = {} } = useSettings();

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
  const [lambdaDeploymentError, setLambdaDeploymentError] = useState<any>(null);
  const lambdaFormLoading = lambdaFormSubmitting || lambdaContractDeploying;

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
          init: { prim: "Unit" },
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
      let error = err;
      if (err.message?.includes("[object Object]") && err.node) {
        error = new Error(
          err.message.replace("[object Object]", JSON.stringify(err.node))
        );
      }
      await withErrorHumanDelay(error, () => setLambdaDeploymentError(error));
    } finally {
      setLambdaContractDeploying(false);
    }
  }, [lambdaFormLoading, lambdaContracts, network.id, tezos, updateSettings]);

  const handleErrorAlertClose = React.useCallback(() => {
    setLambdaDeploymentError(null);
  }, [setLambdaDeploymentError]);

  return (
    <>
      {(() => {
        switch (true) {
          case lambdaContractDeploying:
            return (
              <Alert
                className="mb-4"
                title={t("justAMinute")}
                description={t("waitWhileContractBeingDeployed")}
                type="success"
              />
            );

          case lambdaDeploymentError instanceof Error:
            return (
              <Alert
                className="mb-4"
                type="error"
                title={t("error")}
                description={lambdaDeploymentError!.message}
                closable
                onClose={handleErrorAlertClose}
              />
            );

          default:
            return (
              <Alert
                className="mb-4"
                title={t("attentionExclamation")}
                description={t("noActiveNetLambdaWarningContent")}
              />
            );
        }
      })()}

      <form
        onSubmit={handleLambdaFormSubmit(onLambdaFormSubmit)}
        className="mb-8"
      >
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
          <FormSubmitButton
            loading={lambdaFormSubmitting}
            disabled={lambdaContractDeploying}
          >
            <T id="add" />
          </FormSubmitButton>

          <FormSecondaryButton
            disabled={lambdaFormSubmitting}
            loading={lambdaContractDeploying}
            onClick={onLambdaDeployClick}
          >
            <T id="deployNew" />
          </FormSecondaryButton>
        </div>
      </form>
    </>
  );
};

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

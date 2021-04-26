import React, { FC, useCallback, useState } from "react";

import classNames from "clsx";
import { useForm } from "react-hook-form";

import Alert from "app/atoms/Alert";
import FormField from "app/atoms/FormField";
import FormSecondaryButton from "app/atoms/FormSecondaryButton";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import Name from "app/atoms/Name";
import SubTitle from "app/atoms/SubTitle";
import { URL_PATTERN } from "app/defaults";
import { ReactComponent as CloseIcon } from "app/icons/close.svg";
import HashChip from "app/templates/HashChip";
import { T, t } from "lib/i18n/react";
import { viewLambda } from "lib/michelson";
import { useRetryableSWR } from "lib/swr";
import {
  isKnownChainId,
  loadChainId,
  TempleChainId,
  TempleNetwork,
  useNetwork,
  useSettings,
  useTezos,
  useTempleClient,
  validateContractAddress,
  confirmOperation,
  getOriginatedContractAddress,
  useChainId,
} from "lib/temple/front";
import { COLORS } from "lib/ui/colors";
import { useConfirm } from "lib/ui/dialog";
import { withErrorHumanDelay } from "lib/ui/humanDelay";

type NetworkFormData = Pick<
  TempleNetwork,
  "name" | "rpcBaseURL" | "lambdaContract"
>;
type LambdaFormData = {
  lambdaContract: NonNullable<TempleNetwork["lambdaContract"]>;
};

const SUBMIT_ERROR_TYPE = "submit-error";
const KNOWN_LAMBDA_CONTRACTS = new Map([
  [TempleChainId.Mainnet, "KT1CPuTzwC7h7uLXd5WQmpMFso1HxrLBUtpE"],
  [TempleChainId.Edo2net, "KT1A64nVZDccAHGAsf1ZyVajXZcbiwjV3SnN"],
  [TempleChainId.Florencenet, "KT1BbTmNHmJp2NnQyw5qsAExEYmYuUpR2HdX"],
  [TempleChainId.Delphinet, "KT1EC1oaF3LwjiPto3fpUZiS3sWYuQHGxqXM"],
  [TempleChainId.Carthagenet, "KT1PCtQTdgD44WsYgTzAUUztMcrDmPiSuSV1"],
]);
const NETWORK_IDS = new Map<string, string>([
  [TempleChainId.Mainnet, "mainnet"],
  [TempleChainId.Edo2net, "edo2net"],
  [TempleChainId.Florencenet, "florencenet"],
  [TempleChainId.Delphinet, "delphinet"],
  [TempleChainId.Carthagenet, "carthagenet"],
]);

const CustomNetworksSettings: FC = () => {
  const { updateSettings, defaultNetworks } = useTempleClient();
  const { lambdaContracts = {}, customNetworks = [] } = useSettings();
  const [showNoLambdaWarning, setShowNoLambdaWarning] = useState(false);
  const confirm = useConfirm();

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

      let chainId;
      try {
        chainId = await loadChainId(rpcBaseURL);
      } catch (err) {
        await withErrorHumanDelay(err, () =>
          setError(
            "rpcBaseURL",
            SUBMIT_ERROR_TYPE,
            t("invalidRpcCantGetChainId")
          )
        );
        return;
      }

      if (!lambdaContract) {
        lambdaContract = isKnownChainId(chainId)
          ? KNOWN_LAMBDA_CONTRACTS.get(chainId)
          : lambdaContracts[chainId];
      }

      if (!showNoLambdaWarning && !lambdaContract) {
        setShowNoLambdaWarning(true);
        return;
      }
      setShowNoLambdaWarning(false);

      try {
        const networkId = NETWORK_IDS.get(chainId) ?? rpcBaseURL;
        await updateSettings({
          customNetworks: [
            ...customNetworks,
            {
              rpcBaseURL,
              name,
              description: name,
              type: networkId === "mainnet" ? "main" : "test",
              disabled: false,
              color: COLORS[Math.floor(Math.random() * COLORS.length)],
              id: rpcBaseURL,
              lambdaContract,
            },
          ],
          lambdaContracts: lambdaContract
            ? {
                ...lambdaContracts,
                [chainId]: lambdaContract,
                [networkId]: lambdaContract,
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
      ![...defaultNetworks, ...customNetworks]
        .filter((n) => !n.hidden)
        .some(({ rpcBaseURL }) => rpcBaseURL === url),
    [customNetworks, defaultNetworks]
  );

  const handleRemoveClick = useCallback(
    async (baseUrl: string) => {
      if (
        !(await confirm({
          title: t("actionConfirmation"),
          children: t("deleteNetworkConfirm"),
        }))
      ) {
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
    [customNetworks, setError, updateSettings, confirm]
  );

  return (
    <div className="w-full max-w-sm p-2 pb-4 mx-auto">
      <LambdaContractSection />

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
            "border",
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
          {defaultNetworks
            .filter((n) => !n.hidden)
            .map((network, index) => (
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

const LambdaContractSection: FC = () => {
  const { updateSettings } = useTempleClient();
  const tezos = useTezos();
  const network = useNetwork();
  const netChainId = useChainId(true);
  const { lambdaContracts = {} } = useSettings();

  const contractCheckSWR = useRetryableSWR(
    ["contract-check", tezos.checksum, network.lambdaContract],
    async () => {
      try {
        return Boolean(
          network.lambdaContract &&
            (await tezos.contract.at(network.lambdaContract))
        );
      } catch {
        return false;
      }
    },
    {
      revalidateOnFocus: false,
      suspense: false,
    }
  );
  const displayed = !contractCheckSWR.isValidating && !contractCheckSWR.data;

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
        if (!netChainId) {
          throw new Error(t("failedToLoadChainID"));
        }

        await updateSettings({
          lambdaContracts: {
            ...lambdaContracts,
            [netChainId]: data.lambdaContract,
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
      netChainId,
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
      if (!netChainId) {
        throw new Error(t("failedToLoadChainID"));
      }

      const op = await tezos.wallet
        .originate({
          balance: "0",
          code: viewLambda,
          init: { prim: "Unit" },
        })
        .send();
      const opEntry = await confirmOperation(tezos, op.opHash);
      const contractAddress = getOriginatedContractAddress(opEntry);
      if (!contractAddress) throw new Error(t("contractNotOriginated"));

      await updateSettings({
        lambdaContracts: {
          ...lambdaContracts,
          [netChainId]: contractAddress,
          [network.id]: contractAddress,
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
  }, [
    lambdaFormLoading,
    lambdaContracts,
    netChainId,
    network.id,
    tezos,
    updateSettings,
  ]);

  const handleErrorAlertClose = useCallback(() => {
    setLambdaDeploymentError(null);
  }, [setLambdaDeploymentError]);

  if (!displayed) return null;

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
  network: TempleNetwork;
  onRemoveClick?: (baseUrl: string) => void;
  last: boolean;
};

const NetworksListItem: FC<NetworksListItemProps> = (props) => {
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
        "flex items-stretch",
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
        className={classNames(
          "mt-1 ml-2 mr-3",
          "w-3 h-3",
          "border border-primary-white",
          "rounded-full shadow-xs"
        )}
        style={{ background: color }}
      />

      <div className="flex flex-col justify-between flex-1">
        <Name className="mb-1 text-sm font-medium leading-tight">
          {(nameI18nKey && <T id={nameI18nKey} />) || name}
        </Name>

        <div
          className={classNames(
            "text-xs text-gray-700 font-light",
            "flex items-center"
          )}
          style={{
            marginBottom: "0.125rem",
          }}
        >
          RPC:<Name className="ml-1 font-normal">{rpcBaseURL}</Name>
        </div>

        {lambdaContract && (
          <div className="text-xs text-gray-700 font-light">
            <T
              id="someLambda"
              substitutions={
                <HashChip
                  hash={lambdaContract}
                  type="link"
                  small
                  className="font-normal"
                />
              }
            />
          </div>
        )}
      </div>

      {canRemove && (
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
      )}
    </div>
  );
};

function validateLambdaContract(value: any) {
  return value ? validateContractAddress(value) : true;
}

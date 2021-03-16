import React, { useCallback, useMemo, useRef, useState } from "react";
import classNames from "clsx";
import { Controller, useForm } from "react-hook-form";
import {
  TempleAccountType,
  isAddressValid,
  useRelevantAccounts,
  useTezos,
  TEZ_ASSET,
  useTempleClient,
  useChainId,
  isKnownChainId,
} from "lib/temple/front";
import { getOneUserContracts, TzktRelatedContract } from "lib/tzkt";
import { T, t } from "lib/i18n/react";
import { useRetryableSWR } from "lib/swr";
import CustomSelect, { OptionRenderProps } from "app/templates/CustomSelect";
import Balance from "app/templates/Balance";
import NoSpaceField from "app/atoms/NoSpaceField";
import Identicon from "app/atoms/Identicon";
import Name from "app/atoms/Name";
import AccountTypeBadge from "app/atoms/AccountTypeBadge";
import Money from "app/atoms/Money";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import Alert from "app/atoms/Alert";

type ImportKTAccountFormData = {
  contractAddress: string;
};

const getContractAddress = (contract: TzktRelatedContract) => contract.address;

const ManagedKTForm: React.FC = () => {
  const accounts = useRelevantAccounts();
  const tezos = useTezos();
  const { importKTManagedAccount } = useTempleClient();
  const chainId = useChainId(true);

  const [error, setError] = useState<React.ReactNode>(null);

  const queryKey = useMemo(
    () => [
      "get-accounts-contracts",
      chainId,
      ...accounts
        .filter(({ type }) => type !== TempleAccountType.ManagedKT)
        .map(({ publicKeyHash }) => publicKeyHash),
    ],
    [accounts, chainId]
  );
  const { data: usersContracts = [] } = useRetryableSWR(
    queryKey,
    getUsersContracts
  );

  const remainingUsersContracts = useMemo(() => {
    return usersContracts.filter(
      ({ address }) =>
        !accounts.some(({ publicKeyHash }) => publicKeyHash === address)
    );
  }, [accounts, usersContracts]);

  const {
    watch,
    handleSubmit,
    errors,
    control,
    formState,
    setValue,
    triggerValidation,
  } = useForm<ImportKTAccountFormData>({
    mode: "onChange",
    defaultValues: {},
  });

  const contractAddressFieldRef = useRef<HTMLTextAreaElement>(null);
  const handleContactAddressFocus = useCallback(
    () => contractAddressFieldRef?.current?.focus(),
    []
  );

  const validateContractAddress = React.useCallback(
    (value?: any) => {
      switch (false) {
        case value?.length > 0:
          return true;

        case isAddressValid(value):
          return t("invalidAddress");

        case value.startsWith("KT"):
          return t("notContractAddress");

        case accounts.every(({ publicKeyHash }) => publicKeyHash !== value):
          return t("contractAlreadyImported");

        default:
          return true;
      }
    },
    [accounts]
  );

  const contractAddress = watch("contractAddress");
  const cleanContractAddressField = useCallback(() => {
    setValue("contractAddress", "");
    triggerValidation("contractAddress");
  }, [setValue, triggerValidation]);

  const contractAddressFilled = useMemo(
    () => Boolean(contractAddress && isAddressValid(contractAddress)),
    [contractAddress]
  );

  const filledAccount = useMemo(
    () =>
      (contractAddressFilled &&
        remainingUsersContracts.find((a) => a.address === contractAddress)) ||
      null,
    [contractAddressFilled, remainingUsersContracts, contractAddress]
  );

  const onSubmit = useCallback(
    async ({ contractAddress }: ImportKTAccountFormData) => {
      if (formState.isSubmitting) {
        return;
      }

      setError(null);
      try {
        const contract = await tezos.contract.at(contractAddress);
        const owner = await contract.storage();
        if (typeof owner !== "string") {
          throw new Error(t("invalidManagedContract"));
        }

        if (!accounts.some(({ publicKeyHash }) => publicKeyHash === owner)) {
          throw new Error(t("youAreNotContractManager"));
        }

        const chainId = await tezos.rpc.getChainId();
        await importKTManagedAccount(contractAddress, chainId, owner);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }

        // Human delay
        await new Promise((r) => setTimeout(r, 300));
        setError(err.message);
      }
    },
    [formState, tezos, accounts, importKTManagedAccount]
  );

  const handleKnownContractSelect = useCallback(
    (address: string) => {
      setValue("contractAddress", address);
      triggerValidation("contractAddress");
    },
    [setValue, triggerValidation]
  );

  return (
    <form
      className="w-full max-w-sm mx-auto my-8"
      onSubmit={handleSubmit(onSubmit)}
    >
      {error && (
        <Alert
          type="error"
          title="Error"
          description={error}
          autoFocus
          className="mb-6"
        />
      )}

      <Controller
        name="contractAddress"
        as={<NoSpaceField ref={contractAddressFieldRef} />}
        control={control}
        rules={{
          required: true,
          validate: validateContractAddress,
        }}
        onChange={([v]) => v}
        onFocus={handleContactAddressFocus}
        textarea
        rows={2}
        cleanable={Boolean(contractAddress)}
        onClean={cleanContractAddressField}
        id="contract-address"
        label={t("managedContract")}
        labelDescription={
          filledAccount ? (
            <div className="flex flex-wrap items-center">
              <Identicon
                type="bottts"
                hash={filledAccount.address}
                size={14}
                className="flex-shrink-0 shadow-xs opacity-75"
              />
              <div className="ml-1 mr-px font-normal">
                <T id="contract" />
              </div>{" "}
              (
              <Balance asset={TEZ_ASSET} address={filledAccount.address}>
                {(bal) => (
                  <span className={classNames("text-xs leading-none")}>
                    <Money>{bal}</Money>{" "}
                    <span style={{ fontSize: "0.75em" }}>ꜩ</span>
                  </span>
                )}
              </Balance>
              )
            </div>
          ) : (
            t("contractAddressInputDescription")
          )
        }
        placeholder={t("contractAddressInputPlaceholder")}
        errorCaption={errors.contractAddress?.message}
        style={{
          resize: "none",
        }}
        containerClassName="mb-4"
      />

      <FormSubmitButton loading={formState.isSubmitting}>
        <T id="importAccount" />
      </FormSubmitButton>

      {remainingUsersContracts.length > 0 && !contractAddressFilled && (
        <div className={classNames("mt-8 mb-6", "flex flex-col")}>
          <h2 className={classNames("mb-4", "leading-tight", "flex flex-col")}>
            <span className="text-base font-semibold text-gray-700">
              <T id="addKnownManagedContract" />
            </span>

            <span
              className={classNames("mt-1", "text-xs font-light text-gray-600")}
              style={{ maxWidth: "90%" }}
            >
              <T id="clickOnContractToImport" />
            </span>
          </h2>

          <CustomSelect
            getItemId={getContractAddress}
            items={remainingUsersContracts}
            maxHeight="11rem"
            onSelect={handleKnownContractSelect}
            OptionIcon={ContractIcon}
            OptionContent={ContractOptionContent}
          />
        </div>
      )}
    </form>
  );
};

export default ManagedKTForm;

export const getUsersContracts = async (
  _k: string,
  chainId: string,
  ...accounts: string[]
) => {
  if (!isKnownChainId(chainId)) {
    return [];
  }

  const contractsChunks = await Promise.all(
    accounts.map<Promise<TzktRelatedContract[]>>((account) =>
      getOneUserContracts(chainId, { account }).catch(() => [])
    )
  );
  return contractsChunks.reduce(
    (contracts, chunk) => [
      ...contracts,
      ...chunk.filter(({ kind }) => kind === "delegator_contract"),
    ],
    []
  );
};

type ContractOptionRenderProps = OptionRenderProps<TzktRelatedContract, string>;

const ContractIcon: React.FC<ContractOptionRenderProps> = (props) => {
  return (
    <Identicon
      type="bottts"
      hash={props.item.address}
      size={32}
      className="flex-shrink-0 shadow-xs"
    />
  );
};

const ContractOptionContent: React.FC<ContractOptionRenderProps> = (props) => {
  const { item } = props;

  return (
    <>
      <div className="flex flex-wrap items-center">
        <Name className="text-sm font-medium leading-tight">
          <T id="contract" />
        </Name>

        <AccountTypeBadge account={{ type: TempleAccountType.ManagedKT }} />
      </div>

      <div className="flex flex-wrap items-center mt-1">
        <div className={classNames("text-xs leading-none", "text-gray-700")}>
          {(() => {
            const val = item.address;
            const ln = val.length;
            return (
              <>
                {val.slice(0, 7)}
                <span className="opacity-75">...</span>
                {val.slice(ln - 4, ln)}
              </>
            );
          })()}
        </div>

        <Balance asset={TEZ_ASSET} address={item.address}>
          {(bal) => (
            <div
              className={classNames(
                "ml-2",
                "text-xs leading-none",
                "text-gray-600"
              )}
            >
              <Money>{bal}</Money>{" "}
              <span style={{ fontSize: "0.75em" }}>tez</span>
            </div>
          )}
        </Balance>
      </div>
    </>
  );
};

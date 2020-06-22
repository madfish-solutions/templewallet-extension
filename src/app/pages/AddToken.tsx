import * as React from "react";
import classNames from "clsx";
import { useForm } from "react-hook-form";
import { navigate } from "lib/woozie";
import {
  ThanosToken,
  useTokens,
  useAssets,
  useCurrentAsset,
  ThanosAssetType,
} from "lib/thanos/front";
import PageLayout from "app/layouts/PageLayout";
import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import Alert from "app/atoms/Alert";
import { ReactComponent as AddIcon } from "app/icons/add.svg";

const AddToken: React.FC = () => (
  <PageLayout
    pageTitle={
      <>
        <AddIcon className="mr-1 h-4 w-auto stroke-current" />
        Add Token
      </>
    }
  >
    <Form />
  </PageLayout>
);

export default AddToken;

const TOKEN_TYPES = [
  {
    type: ThanosAssetType.FA1_2,
    name: "FA 1.2",
    comingSoon: false,
  },
  {
    type: ThanosAssetType.FA2,
    name: "FA 2",
    comingSoon: true,
  },
];

type FormData = {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  iconUrl: string;
};

const Form: React.FC = () => {
  const { addToken } = useTokens();
  const { allAssets } = useAssets();
  const { setAssetSymbol } = useCurrentAsset();

  const prevAssetsLengthRef = React.useRef(allAssets.length);
  React.useEffect(() => {
    const assetsLength = allAssets.length;
    if (prevAssetsLengthRef.current < assetsLength) {
      setAssetSymbol(allAssets[assetsLength - 1].symbol);
      navigate("/");
    }
    prevAssetsLengthRef.current = assetsLength;
  }, [allAssets, setAssetSymbol]);

  const { register, handleSubmit, errors, formState } = useForm<FormData>({
    defaultValues: { decimals: 0 },
  });
  const [error, setError] = React.useState<React.ReactNode>(null);
  const [tokenType, setTokenType] = React.useState(TOKEN_TYPES[0]);

  const onSubmit = React.useCallback(
    async ({ address, symbol, name, decimals, iconUrl }: FormData) => {
      if (formState.isSubmitting) return;

      setError(null);
      try {
        const token: ThanosToken = {
          type: tokenType.type as any,
          address,
          symbol,
          name,
          decimals,
          iconUrl,
          fungible: true,
        };
        addToken(token);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }

        // Human delay
        await new Promise((r) => setTimeout(r, 300));
        setError(err.message);
      }
    },
    [tokenType, formState.isSubmitting, addToken, setError]
  );

  return (
    <form
      className="my-8 w-full mx-auto max-w-sm"
      onSubmit={handleSubmit(onSubmit)}
    >
      {error && (
        <Alert
          type="error"
          title="Error"
          autoFocus
          description={error}
          className="mb-6"
        />
      )}

      <div className={classNames("mb-6", "flex flex-col")}>
        <h2 className={classNames("mb-4", "leading-tight", "flex flex-col")}>
          <span className="text-base font-semibold text-gray-700">
            Token type
          </span>

          {/* <span
            className={classNames("mt-1", "text-xs font-light text-gray-600")}
            style={{ maxWidth: "90%" }}
          >
            By default derivation isn't used. Click on 'Custom derivation path'
            to add it.
          </span> */}
        </h2>

        <div
          className={classNames(
            "rounded-md overflow-hidden",
            "border-2 bg-gray-100",
            "flex flex-col",
            "text-gray-700 text-sm leading-tight"
          )}
        >
          {TOKEN_TYPES.map((tt, i, arr) => {
            const last = i === arr.length - 1;
            const selected = tokenType.type === tt.type;
            const handleClick = () => {
              setTokenType(tt);
            };

            return (
              <button
                key={tt.type}
                type="button"
                className={classNames(
                  "block w-full",
                  "overflow-hidden",
                  !last && "border-b border-gray-200",
                  selected
                    ? "bg-gray-300"
                    : "hover:bg-gray-200 focus:bg-gray-200",
                  "flex items-center",
                  "text-gray-700 font-medium",
                  "transition ease-in-out duration-200",
                  "focus:outline-none",
                  tt.comingSoon ? "opacity-50" : "opacity-90 hover:opacity-100"
                )}
                style={{
                  padding: "0.4rem 0.375rem 0.4rem 0.375rem",
                }}
                disabled={tt.comingSoon}
                onClick={!tt.comingSoon ? handleClick : undefined}
              >
                {tt.name}
                {tt.comingSoon && (
                  <span className="ml-1 text-xs font-light">(coming soon)</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <FormField
        ref={register({ required: "Required" })}
        name="address"
        id="addtoken-address"
        label="Address"
        labelDescription="Address of a deployed token contract."
        placeholder="e.g. KT1v9CmPy..."
        errorCaption={errors.address?.message}
        containerClassName="mb-4"
      />

      <FormField
        ref={register({ required: "Required" })}
        name="symbol"
        id="addtoken-symbol"
        label="Symbol"
        labelDescription="Token symbol, like USD for United States Dollar."
        placeholder="e.g. WEW, BOW, LAL etc."
        errorCaption={errors.symbol?.message}
        containerClassName="mb-4"
      />

      <FormField
        ref={register({ required: "Required" })}
        name="name"
        id="addtoken-name"
        label="Name"
        labelDescription="Token name, like Bitcoin for BTC."
        placeholder="e.g. MySuperToken"
        errorCaption={errors.name?.message}
        containerClassName="mb-4"
      />

      <FormField
        ref={register({ required: "Required" })}
        type="number"
        name="decimals"
        id="addtoken-decimals"
        label="Decimals"
        labelDescription="Asset decimals."
        placeholder="0"
        errorCaption={errors.name?.message}
        containerClassName="mb-4"
      />

      <FormField
        ref={register}
        name="iconUrl"
        id="addtoken-iconUrl"
        label={
          <>
            Icon URL{" "}
            <span className="text-sm font-light text-gary-600">(optional)</span>
          </>
        }
        labelDescription="Image URL for token logo."
        placeholder="e.g. https://cdn.com/mytoken.png"
        errorCaption={errors.iconUrl?.message}
        containerClassName="mb-6"
      />

      <FormSubmitButton
        loading={formState.isSubmitting}
        disabled={formState.isSubmitting}
      >
        Add Token
      </FormSubmitButton>
    </form>
  );
};

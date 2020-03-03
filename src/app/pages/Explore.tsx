import * as React from "react";
import classNames from "clsx";
import { useThanosFront } from "lib/thanos/front";
import PageLayout from "app/layouts/PageLayout";
import FormField from "app/atoms/FormField";
import xtzImgUrl from "app/misc/xtz.png";
import EditableTitle from "./Explore/EditableTitle";

const Explore: React.FC = () => {
  const { account } = useThanosFront();
  if (!account) {
    throw new Error("Explore page only allowed with existing Account");
  }

  return (
    <PageLayout>
      <EditableTitle />

      <hr className="mb-4" />

      <div className="flex flex-col items-center">
        <img src={xtzImgUrl} alt="xtz" className="mb-2 h-16 w-auto" />

        <div className="text-gray-700 text-2xl font-light">
          342.2324 <span className="text-lg opacity-75">XTZ</span>
        </div>

        <div className="text-gray-600 text-lg font-light">
          $13.54 <span className="text-sm opacity-75">USD</span>
        </div>

        <div
          className="mt-4 w-full mx-auto flex items-stretch"
          style={{ maxWidth: "16rem" }}
        >
          <div className="w-1/2 p-2">
            <button
              className={classNames(
                "w-full",
                "py-2 px-4 rounded",
                "border-2 border-gray-500 hover:border-gray-600",
                "text-gray-500 hover:text-gray-600",
                "text-base font-bold",
                "transition ease-in-out duration-200"
              )}
              type="button"
            >
              Bake
            </button>
          </div>

          <div className="w-1/2 p-2">
            <button
              className={classNames(
                "w-full",
                "py-2 px-4 rounded",
                "border-2 border-blue-500 hover:border-blue-600",
                "bg-blue-500 hover:bg-blue-600",
                "text-white",
                "text-base font-bold",
                "transition ease-in-out duration-200"
              )}
              type="button"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      <SubTitle>Receive</SubTitle>

      <FormField
        value={account.publicKeyHash}
        className={classNames("w-full mx-auto", "text-center")}
        style={{ maxWidth: "21rem", padding: "0.5rem", fontSize: "0.875rem" }}
        size={36}
        spellCheck={false}
        readOnly
      />

      {/* <button onClick={handleCopyToClipboard}>Copy to Clipboard</button> */}

      {/* <p className="font-base text-gray-600">Hello, {account.publicKeyHash}</p>

      <div className="my-4"></div> */}
    </PageLayout>
  );
};

export default Explore;

type SubTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

const SubTitle: React.FC<SubTitleProps> = ({
  className,
  children,
  ...rest
}) => (
  <h4
    className={classNames(
      "mt-8 mb-4",
      "flex items-center justify-center",
      "text-center",
      "text-gray-500",
      "text-sm",
      "font-semibold",
      "uppercase",
      className
    )}
    {...rest}
  >
    <span className="text-gray-400 text-xs mx-1">•</span>
    {children}
    <span className="text-gray-400 text-xs mx-1">•</span>
  </h4>
);

// function shortifyAddress(adr: string) {
//   const ln = adr.length;
//   return `${adr.slice(0, 5)}..${adr.slice(ln - 3, ln)}`;
// }

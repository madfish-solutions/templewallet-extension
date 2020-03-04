import * as React from "react";
import classNames from "clsx";
import { Link } from "lib/woozie";
// import { useThanosFront } from "lib/thanos/front";
import PageLayout from "app/layouts/PageLayout";
import xtzImgUrl from "app/misc/xtz.png";
import { ReactComponent as QRIcon } from "app/icons/qr.svg";
import { ReactComponent as SendIcon } from "app/icons/send.svg";
import EditableTitle from "./Explore/EditableTitle";

const Explore: React.FC = () => {
  return (
    <PageLayout>
      <EditableTitle />

      <hr className="mb-4" />

      <div className="flex flex-col items-center">
        <img src={xtzImgUrl} alt="xtz" className="mb-2 h-16 w-auto" />

        <div className="text-gray-800 text-2xl font-light">
          342.2324 <span className="text-lg opacity-90">XTZ</span>
        </div>

        <div className="text-gray-600 text-lg font-light">
          $13.54 <span className="text-sm opacity-75">USD</span>
        </div>

        <div
          className="mt-4 w-full mx-auto flex items-stretch"
          style={{ maxWidth: "18rem" }}
        >
          <div className="w-1/2 p-2">
            <Link
              to="/receive"
              className={classNames(
                "block w-full",
                "py-2 px-4 rounded",
                "border-2 border-blue-400 hover:border-blue-500",
                "flex items-center justify-center",
                "text-blue-400 hover:text-blue-500",
                "shadow-sm",
                "text-base font-semibold",
                "transition ease-in-out duration-200"
              )}
              type="button"
            >
              <QRIcon
                className={classNames(
                  "-ml-2 mr-2",
                  "h-5 w-auto",
                  "stroke-current"
                )}
              />
              Receive
            </Link>
          </div>

          <div className="w-1/2 p-2">
            <Link
              to="/send"
              className={classNames(
                "w-full",
                "py-2 px-4 rounded",
                "border-2 border-blue-500 hover:border-blue-600",
                "bg-blue-500 hover:bg-blue-600",
                "shadow-sm",
                "flex items-center justify-center",
                "text-white",
                "text-base font-semibold",
                "transition ease-in-out duration-200"
              )}
              type="button"
            >
              <SendIcon
                className={classNames(
                  "-ml-3 -mt-1 mr-1",
                  "h-5 w-auto",
                  "transform -rotate-45",
                  "stroke-current"
                )}
              />
              Send
            </Link>
          </div>
        </div>
      </div>

      <SubTitle>Baking</SubTitle>

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

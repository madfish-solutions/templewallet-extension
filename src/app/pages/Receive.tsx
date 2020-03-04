import * as React from "react";
import classNames from "clsx";
import { QRCode } from "react-qr-svg";
import { useThanosFront } from "lib/thanos/front";
import useCopyToClipboard from "lib/ui/useCopyToClipboard";
import PageLayout from "app/layouts/PageLayout";
// import Identicon from "app/atoms/Identicon";
import FormField from "app/atoms/FormField";
import { ReactComponent as CopyIcon } from "app/icons/copy.svg";

const Receive: React.FC = () => {
  const { account } = useThanosFront();
  const address = account.publicKeyHash;

  const { fieldRef, copy, copied } = useCopyToClipboard();

  return (
    <PageLayout pageTitle="Receive">
      <div className="py-4">
        <div className={classNames("w-full max-w-sm mx-auto")}>
          {/* <div className="mb-6 flex items-center justify-center">
            <Identicon hash={address} size={24} />

            <span
              className={classNames(
                "ml-2",
                "text-gray-700",
                "text-lg font-semibold"
              )}
            >
              {account.name}
            </span>
          </div> */}

          <FormField
            ref={fieldRef}
            label="Address"
            labelDescription="This address supports transfering & receiving funds."
            value={address}
            size={36}
            spellCheck={false}
            readOnly
            containerClassName="mb-1"
            className="text-center"
            style={{
              padding: "0.5rem",
              fontSize: "0.875rem"
            }}
          />

          <div className="mb-6 flex justify-center">
            <button
              type="button"
              className={classNames(
                "py-1 px-2 w-40",
                "bg-primary-orange rounded",
                "border border-primary-orange",
                "flex items-center justify-center",
                "text-primary-orange-lighter text-shadow-black-orange",
                "text-sm font-semibold",
                "transition duration-300 ease-in-out",
                "opacity-90 hover:opacity-100 focus:opacity-100",
                "shadow-sm",
                "hover:shadow focus:shadow"
              )}
              onClick={copy}
            >
              {copied ? (
                "Copied."
              ) : (
                <>
                  <CopyIcon
                    className={classNames(
                      "mr-1",
                      "h-4 w-auto",
                      "stroke-current stroke-2"
                    )}
                  />
                  Copy to clipboard
                </>
              )}
            </button>
          </div>

          <div className="mb-4 flex flex-col leading-tight">
            <span className="text-base font-semibold text-gray-700">
              QRCode
            </span>

            <span
              className={classNames("mt-1", "text-xs font-light text-gray-600")}
              style={{ maxWidth: "90%" }}
            >
              Scan a QR code to share your Address easily.
            </span>
          </div>

          <div
            className="p-1 bg-gray-100 border-2 border-gray-300 rounded"
            style={{ maxWidth: "60%" }}
          >
            <QRCode
              bgColor="#f7fafc"
              fgColor="#000000"
              level="Q"
              style={{ width: "100%" }}
              value={address}
            />
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Receive;

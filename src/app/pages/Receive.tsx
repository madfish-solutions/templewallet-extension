import * as React from "react";
import classNames from "clsx";
import { QRCode } from "react-qr-svg";
import { useAccount } from "lib/thanos/front";
import { T, t } from "lib/ui/i18n";
import useCopyToClipboard from "lib/ui/useCopyToClipboard";
import PageLayout from "app/layouts/PageLayout";
import FormField from "app/atoms/FormField";
import { ReactComponent as QRIcon } from "app/icons/qr.svg";
import { ReactComponent as CopyIcon } from "app/icons/copy.svg";
// import Deposit from "./Receive/Deposit";

const Receive: React.FC = () => {
  const account = useAccount();
  const address = account.publicKeyHash;

  const { fieldRef, copy, copied } = useCopyToClipboard();

  return (
    <PageLayout
      pageTitle={
        <>
          <QRIcon className="mr-1 h-4 w-auto stroke-current" />
          Receive
        </>
      }
    >
      <div className="py-4">
        <div className={classNames("w-full max-w-sm mx-auto")}>
          <FormField
            textarea
            rows={2}
            ref={fieldRef}
            id="receive-address"
            label="Address"
            labelDescription={t("accountAddressLabel")}
            value={address}
            size={36}
            spellCheck={false}
            readOnly
            style={{
              resize: "none",
            }}
          />

          <button
            type="button"
            className={classNames(
              "mx-auto mb-6",
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
              <T name="copiedAddress">{(message) => <>{message}</>}</T>
            ) : (
              <>
                <CopyIcon
                  className={classNames(
                    "mr-1",
                    "h-4 w-auto",
                    "stroke-current stroke-2"
                  )}
                />
                <T name="copyAddressToClipboard">
                  {(message) => <>{message}</>}
                </T>
              </>
            )}
          </button>

          <div className="flex flex-col items-center">
            <div className="mb-2 text-center leading-tight">
              <T name="qrCode">
                {(message) => (
                  <span className="text-sm font-semibold text-gray-700">
                    {message}
                  </span>
                )}
              </T>
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

            {/* <Deposit address={address} /> */}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Receive;

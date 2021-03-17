import React, { FC, memo, useCallback, useEffect } from "react";

import classNames from "clsx";
import { QRCode } from "react-qr-svg";
import useSWR from "swr";

import FormField from "app/atoms/FormField";
import { ReactComponent as CopyIcon } from "app/icons/copy.svg";
import { ReactComponent as HashIcon } from "app/icons/hash.svg";
import { ReactComponent as LanguageIcon } from "app/icons/language.svg";
import { ReactComponent as QRIcon } from "app/icons/qr.svg";
import PageLayout from "app/layouts/PageLayout";
import ViewsSwitcher, { ViewsSwitcherProps } from "app/templates/ViewsSwitcher";
import { T, t } from "lib/i18n/react";
import { useAccount, useTezos, useTezosDomainsClient } from "lib/temple/front";
import useCopyToClipboard from "lib/ui/useCopyToClipboard";
import useSafeState from "lib/ui/useSafeState";
// import Deposit from "./Receive/Deposit";

const ADDRESS_FIELD_VIEWS = [
  {
    Icon: LanguageIcon,
    key: "domain",
    name: t("domain"),
  },
  {
    Icon: HashIcon,
    key: "hash",
    name: t("hash"),
  },
];

const Receive: FC = () => {
  const account = useAccount();
  const tezos = useTezos();
  const { resolver: domainsResolver, isSupported } = useTezosDomainsClient();
  const address = account.publicKeyHash;

  const { fieldRef, copy, copied } = useCopyToClipboard();
  const [activeView, setActiveView] = useSafeState(ADDRESS_FIELD_VIEWS[1]);

  const resolveDomainReverseName = useCallback(
    (_k: string, pkh: string) => domainsResolver.resolveAddressToName(pkh),
    [domainsResolver]
  );

  const { data: reverseName } = useSWR(
    () => ["tzdns-reverse-name", address, tezos.checksum],
    resolveDomainReverseName,
    { shouldRetryOnError: false, revalidateOnFocus: false }
  );

  useEffect(() => {
    if (!isSupported) {
      setActiveView(ADDRESS_FIELD_VIEWS[1]);
    }
  }, [isSupported, setActiveView]);

  return (
    <PageLayout
      pageTitle={
        <>
          <QRIcon className="w-auto h-4 mr-1 stroke-current" />
          <T id="receive" />
        </>
      }
    >
      <div className="py-4">
        <div className={classNames("w-full max-w-sm mx-auto")}>
          <FormField
            extraSection={
              reverseName && (
                <AddressFieldExtraSection
                  activeView={activeView}
                  onSwitch={setActiveView}
                />
              )
            }
            textarea
            rows={2}
            ref={fieldRef}
            id="receive-address"
            label={t("address")}
            labelDescription={t("accountAddressLabel")}
            value={activeView.key === "hash" ? address : reverseName || ""}
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
              <T id="copiedAddress" />
            ) : (
              <>
                <CopyIcon
                  className={classNames(
                    "mr-1",
                    "h-4 w-auto",
                    "stroke-current stroke-2"
                  )}
                />
                <T id="copyAddressToClipboard" />
              </>
            )}
          </button>

          <div className="flex flex-col items-center">
            <div className="mb-2 leading-tight text-center">
              <T id="qrCode">
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

type AddressFieldExtraSectionProps = {
  activeView: ViewsSwitcherProps["activeItem"];
  onSwitch: ViewsSwitcherProps["onChange"];
};

const AddressFieldExtraSection = memo<AddressFieldExtraSectionProps>(
  (props) => {
    const { activeView, onSwitch } = props;

    return (
      <div className="mb-2 flex justify-end">
        <ViewsSwitcher
          activeItem={activeView}
          items={ADDRESS_FIELD_VIEWS}
          onChange={onSwitch}
        />
      </div>
    );
  }
);

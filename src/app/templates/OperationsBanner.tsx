import React, { CSSProperties, memo, ReactNode } from "react";

import classNames from "clsx";
import ReactJson from "react-json-view";

import { ReactComponent as CopyIcon } from "app/icons/copy.svg";
import { T } from "lib/i18n/react";
import useCopyToClipboard from "lib/ui/useCopyToClipboard";

type OperationsBannerProps = {
  jsonViewStyle?: CSSProperties;
  opParams: any[] | { branch: string; contents: any[] } | string;
  label?: ReactNode;
  className?: string;
};

const OperationsBanner = memo<OperationsBannerProps>(
  ({ jsonViewStyle, opParams, label, className }) => {
    opParams =
      typeof opParams === "string" ? opParams : formatOpParams(opParams);

    return (
      <>
        {label && (
          <h2
            className={classNames(
              "w-full mb-2",
              "text-base font-semibold leading-tight",
              "text-gray-700"
            )}
          >
            {label}
          </h2>
        )}

        <div className={classNames("relative mb-2", className)}>
          <div
            className={classNames(
              "block w-full max-w-full p-1",
              "rounded-md",
              "border-2 bg-gray-100 bg-opacity-50",
              "text-xs leading-tight font-medium",
              typeof opParams === "string"
                ? "break-all"
                : "whitespace-no-wrap overflow-auto"
            )}
            style={{
              height: "10rem",
              ...jsonViewStyle,
            }}
          >
            {typeof opParams === "string" ? (
              <div
                className={classNames(
                  "p-1",
                  "text-lg text-gray-700 font-normal"
                )}
              >
                {opParams}
              </div>
            ) : (
              <ReactJson
                src={opParams}
                name={null}
                iconStyle="square"
                indentWidth={4}
                collapsed={Array.isArray(opParams) ? 2 : 3}
                collapseStringsAfterLength={36}
                enableClipboard={false}
                displayObjectSize={false}
                displayDataTypes={false}
              />
            )}
          </div>

          <div className={classNames("absolute top-0 right-0 pt-2 pr-2")}>
            <CopyButton toCopy={opParams} />
          </div>
        </div>
      </>
    );
  }
);

export default OperationsBanner;

type CopyButtonProps = {
  toCopy: any;
};

const CopyButton = memo<CopyButtonProps>(({ toCopy }) => {
  const { fieldRef, copy, copied } = useCopyToClipboard<HTMLTextAreaElement>();

  const text =
    typeof toCopy === "string" ? toCopy : JSON.stringify(toCopy, null, 2);

  return (
    <>
      <button
        type="button"
        className={classNames(
          "mx-auto",
          "p-1",
          "bg-primary-orange rounded",
          "border border-primary-orange",
          "flex items-center justify-center",
          "text-primary-orange-lighter text-shadow-black-orange",
          "text-xs font-semibold leading-snug",
          "transition duration-300 ease-in-out",
          "opacity-90 hover:opacity-100 focus:opacity-100",
          "shadow-sm",
          "hover:shadow focus:shadow"
        )}
        onClick={copy}
      >
        {copied ? (
          <T id="copiedHash" />
        ) : (
          <CopyIcon
            className={classNames("h-4 w-auto", "stroke-current stroke-2")}
          />
        )}
      </button>

      <textarea ref={fieldRef} value={text} readOnly className="sr-only" />
    </>
  );
});

function formatOpParams(opParams: any) {
  try {
    if ("contents" in opParams) {
      return {
        ...opParams,
        contents: opParams.contents.map(formatTransferParams),
      };
    } else {
      return opParams.map(formatTransferParams);
    }
  } catch {
    return opParams;
  }
}

function formatTransferParams(tParams: any) {
  const { to, mutez, parameter, ...rest } = tParams;
  const newTParams = to ? { destination: to, ...rest } : rest;
  if (parameter) {
    newTParams.parameters = parameter;
  }
  return newTParams;
}

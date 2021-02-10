import * as React from "react";
import classNames from "clsx";
import ReactJson from "react-json-view";

type OperationsBannerProps = {
  jsonViewStyle?: React.CSSProperties;
  opParams: any[] | { branch: string; contents: any[] } | string;
  label?: React.ReactNode;
  className?: string;
};

const OperationsBanner = React.memo<OperationsBannerProps>(
  ({ jsonViewStyle, opParams, label, className }) => (
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

      <div
        className={classNames(
          "block w-full max-w-full mb-2 p-1",
          "rounded-md",
          "border-2 bg-gray-100 bg-opacity-50",
          "text-base leading-tight font-medium whitespace-no-wrap",
          typeof opParams === "string"
            ? "whitespace-pre-wrap"
            : "overflow-auto",
          className
        )}
        style={{
          height: "10rem",
          ...jsonViewStyle,
        }}
      >
        {typeof opParams === "string" ? (
          <div
            className={classNames("p-1", "text-lg text-gray-700 font-normal")}
          >
            {opParams}
          </div>
        ) : (
          <ReactJson
            src={opParams}
            name={null}
            iconStyle="square"
            indentWidth={4}
            collapsed={false}
            collapseStringsAfterLength={36}
            enableClipboard={false}
            displayObjectSize={false}
            displayDataTypes={false}
          />
        )}
      </div>
    </>
  )
);

export default OperationsBanner;

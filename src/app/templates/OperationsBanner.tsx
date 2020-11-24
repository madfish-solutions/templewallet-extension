import * as React from "react";
import classNames from "clsx";
import ReactJson from "react-json-view";

type OperationsBanner = {
  containerStyle?: React.CSSProperties;
  opParams: any[] | { branch: string; contents: any[] };
  label?: React.ReactNode;
  className?: string;
};

const OperationsBanner = React.memo<OperationsBanner>(
  ({ containerStyle, opParams, label, className }) => (
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
          "rounded-md overflow-auto",
          "border-2 bg-gray-100 bg-opacity-50",
          "text-base leading-tight font-medium whitespace-no-wrap",
          className
        )}
        style={{
          height: "10rem",
          ...containerStyle,
        }}
      >
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
      </div>
    </>
  )
);

export default OperationsBanner;

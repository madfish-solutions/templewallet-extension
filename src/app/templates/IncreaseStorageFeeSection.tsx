import React from "react";

import classNames from "clsx";

import { INCREASE_STORAGE_FEE_VARIANTS } from "lib/temple/front";

type IncreaseStorageFeeSectionProps = {
  value: number;
  onChange: (newValue: number) => void;
  className?: string;
  style?: React.CSSProperties;
};

const IncreaseStorageFeeSection: React.FC<IncreaseStorageFeeSectionProps> = ({
  value,
  onChange,
  className,
  style = {},
}) => (
  <div
    className={classNames("mt-2 px-1 flex items-center", className)}
    style={style}
  >
    <div className="flex-1">
      <div
        className={classNames(
          "whitespace-no-wrap overflow-x-auto no-scrollbar",
          "text-xs text-gray-600"
        )}
        style={{ maxWidth: "10rem" }}
      >
        Increase storage fee:
      </div>
    </div>

    {INCREASE_STORAGE_FEE_VARIANTS.map((toIncrease) => (
      <button
        key={toIncrease}
        className={classNames(
          "border",
          "rounded",
          "text-xs font-medium",
          "select-none",
          toIncrease === value
            ? "bg-primary-orange border-primary-orange border-opacity-90 text-white"
            : "text-gray-600"
        )}
        style={{
          paddingLeft: "0.375rem",
          paddingRight: "0.375rem",
          marginLeft: "0.375rem",
        }}
        onClick={() => onChange(toIncrease)}
      >
        +{toIncrease}%
      </button>
    ))}
  </div>
);

export default IncreaseStorageFeeSection;

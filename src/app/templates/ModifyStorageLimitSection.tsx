import React, { useCallback } from "react";

import classNames from "clsx";

import { T } from "lib/i18n/react";

type ModifyStorageLimitSectionProps = {
  value: number;
  onChange: (newValue: number) => void;
  className?: string;
  style?: React.CSSProperties;
};

const ModifyStorageLimitSection: React.FC<ModifyStorageLimitSectionProps> = ({
  value,
  onChange,
  className,
  style = {},
}) => {
  const handleChange = useCallback(
    (e) => {
      if (e.target.value.length > 10) return;
      const val = +e.target.value;
      onChange(val > 0 ? val : 0);
    },
    [onChange]
  );

  return (
    <div
      className={classNames("mt-2 flex items-stretch", className)}
      style={style}
    >
      <div className="flex items-center w-2/3">
        <div
          className={classNames(
            "max-w-full whitespace-no-wrap overflow-x-auto no-scrollbar",
            "text-xs text-gray-600"
          )}
        >
          <T id="storageLimit" />:
        </div>
      </div>

      <input
        type="number"
        value={value || ""}
        onChange={handleChange}
        placeholder="0"
        className={classNames(
          "appearance-none",
          "w-1/3",
          "py-px pl-2",
          "border",
          "border-gray-300",
          "focus:border-primary-orange",
          "bg-gray-100 focus:bg-transparent",
          "focus:outline-none focus:shadow-outline",
          "transition ease-in-out duration-200",
          "rounded",
          "text-right",
          "text-gray-700 text-sm leading-tight",
          "placeholder-gray-600"
        )}
      />
    </div>
  );
};

export default ModifyStorageLimitSection;

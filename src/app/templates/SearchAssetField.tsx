import React, { FC, InputHTMLAttributes, useCallback } from "react";

import classNames from "clsx";

import CleanButton from "app/atoms/CleanButton";
import { ReactComponent as SearchIcon } from "app/icons/search.svg";
import { t } from "lib/i18n/react";

type SearchAssetFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  value: string;
  onValueChange: (v: string) => void;
};

const SearchAssetField: FC<SearchAssetFieldProps> = ({
  value,
  onValueChange,
  ...rest
}) => {
  const handleChange = useCallback(
    (evt) => {
      onValueChange(evt.target.value);
    },
    [onValueChange]
  );

  const handleClean = useCallback(() => {
    onValueChange("");
  }, [onValueChange]);

  return (
    <div className={classNames("w-full flex flex-col")}>
      <div className={classNames("relative", "flex items-stretch")}>
        <input
          type="text"
          placeholder={t("searchAssets")}
          className={classNames(
            "appearance-none",
            "w-full",
            "py-2 pl-8 pr-4",
            "bg-gray-100 focus:bg-transparent",
            "border border-transparent",
            "focus:outline-none focus:border-gray-300",
            "transition ease-in-out duration-200",
            "rounded-md",
            "text-gray-700 text-sm leading-tight",
            "placeholder-alphagray"
          )}
          value={value}
          spellCheck={false}
          autoComplete="off"
          onChange={handleChange}
          {...rest}
        />

        <div
          className={classNames(
            "absolute left-0 top-0 bottom-0",
            "px-2 flex items-center",
            "text-gray-500"
          )}
        >
          <SearchIcon className="h-5 w-auto stroke-current" />
        </div>

        {Boolean(value) && (
          <CleanButton bottomOffset="0.45rem" onClick={handleClean} />
        )}
      </div>
    </div>
  );
};

export default SearchAssetField;

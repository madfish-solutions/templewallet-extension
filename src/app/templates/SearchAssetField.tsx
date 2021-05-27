import React, { FC, InputHTMLAttributes } from "react";

import classNames from "clsx";

import SearchField from "app/templates/SearchField";
import { t } from "lib/i18n/react";

type SearchAssetFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  value: string;
  onValueChange: (v: string) => void;
};

const SearchAssetField: FC<SearchAssetFieldProps> = ({
  className,
  ...rest
}) => {
  return (
    <SearchField
      className={classNames(
        "py-2 pl-8 pr-4",
        "bg-gray-100 focus:bg-transparent",
        "border border-transparent",
        "focus:outline-none focus:border-gray-300",
        "transition ease-in-out duration-200",
        "rounded-md",
        "text-gray-700 text-sm leading-tight",
        "placeholder-alphagray",
        className
      )}
      placeholder={t("searchAssets")}
      searchIconClassName="h-5 w-auto"
      searchIconWrapperClassName="px-2 text-gray-500"
      {...rest}
    />
  );
};

export default SearchAssetField;

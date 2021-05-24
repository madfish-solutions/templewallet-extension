import React, { FC, InputHTMLAttributes, useCallback } from "react";

import classNames from "clsx";

import CleanButton from "app/atoms/CleanButton";
import { ReactComponent as SearchIcon } from "app/icons/search.svg";

type SearchFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  bottomOffset?: string;
  containerClassName?: string;
  searchIconClassName?: string;
  searchIconWrapperClassName?: string;
  value: string;
  onValueChange: (v: string) => void;
};

const SearchField: FC<SearchFieldProps> = ({
  bottomOffset = "0.45rem",
  className,
  containerClassName,
  value,
  onValueChange,
  searchIconClassName,
  searchIconWrapperClassName,
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
    <div className={classNames("w-full flex flex-col", containerClassName)}>
      <div className={classNames("relative", "flex items-stretch")}>
        <input
          type="text"
          className={classNames("appearance-none w-full", className)}
          value={value}
          spellCheck={false}
          autoComplete="off"
          onChange={handleChange}
          {...rest}
        />

        <div
          className={classNames(
            "absolute left-0 top-0 bottom-0",
            "flex items-center",
            searchIconWrapperClassName
          )}
        >
          <SearchIcon
            className={classNames("stroke-current", searchIconClassName)}
          />
        </div>

        {Boolean(value) && (
          <CleanButton bottomOffset={bottomOffset} onClick={handleClean} />
        )}
      </div>
    </div>
  );
};

export default SearchField;

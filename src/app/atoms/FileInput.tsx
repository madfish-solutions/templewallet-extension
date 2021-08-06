import React, { forwardRef } from "react";

import classNames from "clsx";

type FileInputProps = Omit<
  React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  >,
  "type"
>;

const FileInput = forwardRef<HTMLInputElement, FileInputProps>(
  ({ children, className, ...restProps }, ref) => (
    <div className={classNames("relative w-full", className)}>
      <input
        className={classNames(
          "appearance-none",
          "absolute inset-0 w-full",
          "block py-2 px-4",
          "opacity-0",
          "cursor-pointer"
        )}
        ref={ref}
        type="file"
        {...restProps}
      />

      {children}
    </div>
  )
);

export default FileInput;

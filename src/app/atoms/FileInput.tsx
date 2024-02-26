import React, { useCallback, useEffect, useRef } from 'react';

import classNames from 'clsx';

export type FileInputProps = Omit<
  React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>,
  'type' | 'onChange' | 'value'
> & {
  onChange?: (newValue?: FileList) => void;
  value?: FileList;
};

export const FileInput: React.FC<FileInputProps> = ({ children, className, onChange, value, ...restProps }) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { files } = e.target;
      if (files && files.length > 0) {
        onChange?.(files);
      }
    },
    [onChange]
  );

  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current && value !== ref.current.files) {
      // @ts-expect-error
      ref.current.value = value ?? [];
    }
  }, [value, ref]);

  return (
    <div className={classNames('relative w-full', className)}>
      <input
        className={classNames(
          'appearance-none',
          'absolute inset-0 w-full',
          'block py-2 px-4',
          'opacity-0',
          'cursor-pointer'
        )}
        onChange={handleChange}
        ref={ref}
        type="file"
        {...restProps}
      />

      {children}
    </div>
  );
};

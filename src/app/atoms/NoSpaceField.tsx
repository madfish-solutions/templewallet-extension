import { FC, ChangeEvent, Ref, useCallback } from 'react';

import { FormFieldProps, FormField } from './FormField';

type NoSpaceFieldProps = FormFieldProps & {
  value?: string;
  onChange?: SyncFn<string>;
  ref?: Ref<HTMLTextAreaElement>;
};

export const NoSpaceField: FC<NoSpaceFieldProps> = ({ value, onChange, ref, ...rest }) => {
  const format = useCallback((val: string) => val.replace(/\s/g, ''), []);

  const handleChange = useCallback(
    (evt: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const formatted = format(evt.target.value);
      if (onChange) {
        onChange(formatted);
      }
    },
    [format, onChange]
  );

  return <FormField ref={ref} value={value} onChange={handleChange} {...rest} />;
};

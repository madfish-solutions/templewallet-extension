import { FC, ChangeEvent, Ref } from 'react';

import { FormFieldProps, FormField } from './FormField';

type NoSpaceFieldProps = FormFieldProps & {
  value?: string;
  onChange?: SyncFn<string>;
  ref?: Ref<HTMLTextAreaElement>;
};

export const NoSpaceField: FC<NoSpaceFieldProps> = ({ value, onChange, ref, ...rest }) => {
  const handleChange = (evt: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const formatted = evt.target.value.replace(/\s/g, '');
    if (onChange) {
      onChange(formatted);
    }
  };

  return <FormField ref={ref} value={value} onChange={handleChange} {...rest} />;
};

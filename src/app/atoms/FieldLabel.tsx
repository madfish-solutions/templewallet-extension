import React, { ReactNode } from 'react';

import clsx from 'clsx';

interface Props {
  className: string;
  labelContainerClassName?: string;
  label: ReactNode;
  description?: ReactNode;
  warning?: ReactNode;
  id?: string;
}

export const FieldLabel: React.FC<Props> = ({
  label,
  labelContainerClassName,
  className,
  description,
  warning,
  id
}) => (
  <label className={clsx(className, 'text-font-description flex flex-col')} htmlFor={id}>
    <span className={clsx('font-semibold', labelContainerClassName)}>{label}</span>

    {description && <span className="mt-1 text-grey-1">{description}</span>}

    {warning && <span className="mt-1 font-medium text-error">{warning}</span>}
  </label>
);

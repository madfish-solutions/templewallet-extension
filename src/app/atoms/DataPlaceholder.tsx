import React, { FC } from 'react';

import { T, TProps } from 'lib/i18n';
import { NoResultIcon } from 'lib/icons';

interface Props extends Pick<TProps, 'id'> {}

export const DataPlaceholder: FC<Props> = ({ id }) => (
  <div className="flex flex-col items-center justify-center mt-4">
    <NoResultIcon />
    <p className="text-gray-600 text-base font-light">
      <T id={id} />
    </p>
  </div>
);

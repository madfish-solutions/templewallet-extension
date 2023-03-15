import React, { FC } from 'react';

import Spinner from 'app/atoms/Spinner/Spinner';

export const SpinnerSection: FC = () => (
  <div className="flex justify-center my-8">
    <Spinner className="w-20" />
  </div>
);

import React, { FC } from 'react';

import { FormField, IconBase } from 'app/atoms';
import { ReactComponent as InfoFillIcon } from 'app/icons/base/InfoFill.svg';

export const AdvancedTab: FC = () => {
  return (
    <>
      <div className="mb-1 px-1 flex flex-row justify-between items-center">
        <p className="text-font-description-bold">Gas Limit</p>
        <IconBase Icon={InfoFillIcon} size={12} className="text-grey-2" />
      </div>

      <FormField type="number" name="gas-limit" id="gas-limit" placeholder="0.0" />

      <div className="mt-3 mb-1 px-1 flex flex-row justify-between items-center">
        <p className="text-font-description-bold">Nonce</p>
        <IconBase Icon={InfoFillIcon} size={12} className="text-grey-2" />
      </div>

      <FormField type="number" name="nonce" id="nonce" placeholder="0.0" />
    </>
  );
};

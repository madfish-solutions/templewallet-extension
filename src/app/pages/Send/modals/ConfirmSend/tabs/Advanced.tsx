import React, { FC } from 'react';

import { FormField } from 'app/atoms';
import { InfoIcon } from 'app/atoms/InfoIcon';
import { T } from 'lib/i18n';

export const AdvancedTab: FC = () => {
  return (
    <>
      <div className="mb-1 px-1 flex flex-row justify-between items-center">
        <p className="text-font-description-bold">
          <T id="gasLimit" />
        </p>
        <InfoIcon infoContent="gasLimitInfoContent" />
      </div>

      <FormField type="number" name="gas-limit" id="gas-limit" placeholder="0.0" />

      <div className="mt-3 mb-1 px-1 flex flex-row justify-between items-center">
        <p className="text-font-description-bold">
          <T id="nonce" />
        </p>
        <InfoIcon infoContent="nonceInfoContent" />
      </div>

      <FormField type="number" name="nonce" id="nonce" placeholder="0.0" />
    </>
  );
};

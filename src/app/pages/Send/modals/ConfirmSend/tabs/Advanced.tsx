import React, { FC } from 'react';

import { FormField } from 'app/atoms';
import { Tooltip } from 'app/atoms/Tooltip';
import { t, T } from 'lib/i18n';

export const AdvancedTab: FC = () => {
  return (
    <>
      <div className="mb-1 px-1 flex flex-row justify-between items-center">
        <p className="text-font-description-bold">
          <T id="gasLimit" />
        </p>
        <Tooltip content={t('gasLimitInfoContent')} size={12} className="text-grey-2" />
      </div>

      <FormField type="number" name="gas-limit" id="gas-limit" placeholder="0.0" />

      <div className="mt-3 mb-1 px-1 flex flex-row justify-between items-center">
        <p className="text-font-description-bold">
          <T id="nonce" />
        </p>
        <Tooltip content={t('nonceInfoContent')} size={12} className="text-grey-2" />
      </div>

      <FormField type="number" name="nonce" id="nonce" placeholder="0.0" />
    </>
  );
};

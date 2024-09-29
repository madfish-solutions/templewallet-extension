import React, { FC } from 'react';

import { Controller, UseFormReturn } from 'react-hook-form-v7';

import AssetField from 'app/atoms/AssetField';
import { Tooltip } from 'app/atoms/Tooltip';
import { t, T } from 'lib/i18n';

import { EvmConfirmFormData } from '../interfaces';

interface Props {
  form: UseFormReturn<EvmConfirmFormData>;
}

export const AdvancedTab: FC<Props> = ({ form }) => {
  const { control } = form;

  return (
    <>
      <div className="mb-1 px-1 flex flex-row justify-between items-center">
        <p className="text-font-description-bold">
          <T id="gasLimit" />
        </p>
        <Tooltip content={t('gasLimitInfoContent')} size={12} className="text-grey-2" />
      </div>

      <Controller
        name="gasLimit"
        control={control}
        render={({ field }) => <AssetField placeholder="0.00" min={0} onlyInteger {...field} />}
      />

      <div className="mt-3 mb-1 px-1 flex flex-row justify-between items-center">
        <p className="text-font-description-bold">
          <T id="nonce" />
        </p>
        <Tooltip content={t('nonceInfoContent')} size={12} className="text-grey-2" />
      </div>

      <Controller
        name="nonce"
        control={control}
        render={({ field }) => <AssetField placeholder="0" min={0} onlyInteger {...field} />}
      />
    </>
  );
};

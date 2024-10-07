import React, { FC } from 'react';

import { Controller, useFormContext } from 'react-hook-form-v7';

import { IconBase, NoSpaceField } from 'app/atoms';
import AssetField from 'app/atoms/AssetField';
import { CopyButton } from 'app/atoms/CopyButton';
import { Tooltip } from 'app/atoms/Tooltip';
import { ReactComponent as CopyIcon } from 'app/icons/base/copy.svg';
import { t, T } from 'lib/i18n';

import { useEvmEstimationDataState } from '../context';
import { EvmTxParamsFormData, TezosTxParamsFormData } from '../interfaces';

interface AdvancedTabProps {
  isEvm?: boolean;
}

export const AdvancedTab: FC<AdvancedTabProps> = ({ isEvm = false }) => {
  return isEvm ? <EvmContent /> : <TezosContent />;
};

const EvmContent = () => {
  const { control, getValues } = useFormContext<EvmTxParamsFormData>();
  const { data } = useEvmEstimationDataState();

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
        render={({ field: { value, onChange, onBlur } }) => (
          <AssetField
            value={value || data?.gas.toString()}
            placeholder="0.00"
            min={0}
            onlyInteger
            onChange={v => onChange(v ?? '')}
            onBlur={onBlur}
          />
        )}
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
        render={({ field: { value, onChange, onBlur } }) => (
          <AssetField
            value={value || data?.nonce}
            placeholder="0"
            min={0}
            onlyInteger
            onChange={v => onChange(v ?? '')}
            onBlur={onBlur}
          />
        )}
      />

      <div className="mt-4 mb-1 flex flex-row justify-between items-center">
        <p className="p-1 text-font-description-bold">Data</p>
        <CopyButton
          text={data?.data ?? ''}
          className="text-secondary flex text-font-description-bold items-center px-1 py-0.5"
        >
          <span>Copy</span>
          <IconBase size={12} Icon={CopyIcon} />
        </CopyButton>
      </div>
      <Controller
        name="data"
        control={control}
        render={() => (
          <NoSpaceField value={data?.data} textarea rows={5} readOnly placeholder="Info" style={{ resize: 'none' }} />
        )}
      />

      <div className="mt-4 mb-1 flex flex-row justify-between items-center">
        <p className="p-1 text-font-description-bold">Raw Transaction</p>
        <CopyButton
          text={getValues().rawTransaction}
          className="text-secondary flex text-font-description-bold items-center px-1 py-0.5"
        >
          <span>Copy</span>
          <IconBase size={12} Icon={CopyIcon} />
        </CopyButton>
      </div>
      <Controller
        name="rawTransaction"
        control={control}
        render={({ field }) => (
          <NoSpaceField textarea rows={5} readOnly placeholder="Info" style={{ resize: 'none' }} {...field} />
        )}
      />
    </>
  );
};

const TezosContent = () => {
  const { control, getValues } = useFormContext<TezosTxParamsFormData>();

  return (
    <>
      <div className="mt-4 mb-1 flex flex-row justify-between items-center">
        <p className="p-1 text-font-description-bold">Raw Transaction</p>
        <CopyButton
          text={getValues().rawTransaction}
          className="text-secondary flex text-font-description-bold items-center px-1 py-0.5"
        >
          <span>Copy</span>
          <IconBase size={12} Icon={CopyIcon} />
        </CopyButton>
      </div>
      <Controller
        name="rawTransaction"
        control={control}
        render={({ field }) => (
          <NoSpaceField textarea rows={3} readOnly placeholder="Info" style={{ resize: 'none' }} {...field} />
        )}
      />
    </>
  );
};

import React, { FC } from 'react';

import { TID, t } from '../../lib/i18n';
import { FormSecondaryButton } from './FormSecondaryButton';
import { FormSubmitButton } from './FormSubmitButton';

interface Props {
  text: string;
  description: string;
  onEnable?: EmptyFn;
  onDisable?: EmptyFn;
  enableButtonText?: TID;
  disableButtonText?: TID;
}

export const Banner: FC<Props> = ({
  text,
  description,
  onEnable,
  onDisable,
  enableButtonText = 'enable',
  disableButtonText = 'disable'
}) => (
  <div className="p-3 border border-gray-300 rounded-md bg-white mx-4 sm:mx-0 mb-3">
    <p className="text-sm font-medium text-gray-900 mb-1">{text}</p>

    <p className="text-xs font-normal text-gray-700 mb-4">{description}</p>

    <div className="flex justify-between">
      <FormSecondaryButton small className="flex-1 mr-4 h-2.25 rounded-md" type="button" onClick={onDisable}>
        <span className="capitalize text-base text-center w-full">{t(disableButtonText)}</span>
      </FormSecondaryButton>

      <FormSubmitButton small className="flex-1 h-2.25 rounded-md" onClick={onEnable}>
        <span className="capitalize text-base text-center w-full whitespace-nowrap">{t(enableButtonText)}</span>
      </FormSubmitButton>
    </div>
  </div>
);

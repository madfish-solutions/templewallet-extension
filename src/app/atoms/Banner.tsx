import React, { FC } from 'react';

import { TestIDProps } from 'lib/analytics';
import { TID, T } from 'lib/i18n';

import { FormSecondaryButton } from './FormSecondaryButton';
import { FormSubmitButton } from './FormSubmitButton';

interface Props {
  title: TID;
  description: TID;
  enableButton: BannerButtonProps;
  disableButton: BannerButtonProps;
}

export interface BannerButtonProps extends TestIDProps {
  title?: TID;
  onClick: EmptyFn;
}

export const Banner: FC<Props> = ({ title, description, enableButton, disableButton }) => (
  <div className="p-3 border border-gray-300 rounded-md bg-white mx-4 sm:mx-0 mb-3">
    <h5 className="text-sm font-medium text-gray-900 mb-1 whitespace-pre-line">
      <T id={title} />
    </h5>

    <p className="text-xs font-normal text-gray-700 mb-4 whitespace-pre-line">
      <T id={description} />
    </p>

    <div className="flex flex-wrap gap-x-4 gap-y-2">
      <FormSecondaryButton
        small
        className="flex-1 h-2.25 rounded-md"
        onClick={disableButton.onClick}
        testID={disableButton.testID}
        testIDProperties={disableButton.testIDProperties}
      >
        <span className="capitalize text-base text-center w-full whitespace-pre">
          <T id={disableButton.title ?? 'disable'} />
        </span>
      </FormSecondaryButton>

      <FormSubmitButton
        small
        className="flex-1 h-2.25 rounded-md"
        onClick={enableButton.onClick}
        testID={enableButton.testID}
        testIDProperties={enableButton.testIDProperties}
      >
        <span className="capitalize text-base text-center w-full whitespace-pre">
          <T id={enableButton.title ?? 'enable'} />
        </span>
      </FormSubmitButton>
    </div>
  </div>
);

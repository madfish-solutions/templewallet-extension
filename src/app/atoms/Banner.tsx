import React, { FC } from 'react';

import clsx from 'clsx';

import { TestIDProps } from 'lib/analytics';
import { TID, T } from 'lib/i18n';

import { FormSecondaryButton } from './FormSecondaryButton';
import { FormSubmitButton } from './FormSubmitButton';

interface Props {
  title: React.ReactElement;
  description: TID;
  enableButton: BannerButtonProps;
  disableButton: BannerButtonProps;
}

export interface BannerButtonProps extends TestIDProps {
  title: TID;
  capitalize?: boolean;
  onClick: EmptyFn;
}

export const Banner: FC<Props> = ({ title, description, enableButton, disableButton }) => (
  <div className="p-3 border border-gray-300 rounded-md bg-white mx-4 sm:mx-0 mb-3">
    <h5 className="text-sm font-medium text-gray-900 mb-1 whitespace-pre-line">{title}</h5>

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
        <span className={clsx('text-base text-center w-full whitespace-pre', disableButton.capitalize && 'capitalize')}>
          <T id={disableButton.title} />
        </span>
      </FormSecondaryButton>

      <FormSubmitButton
        small
        className="flex-1 h-2.25 rounded-md"
        onClick={enableButton.onClick}
        testID={enableButton.testID}
        testIDProperties={enableButton.testIDProperties}
      >
        <span className={clsx('text-base text-center w-full whitespace-pre', enableButton.capitalize && 'capitalize')}>
          <T id={enableButton.title} />
        </span>
      </FormSubmitButton>
    </div>
  </div>
);

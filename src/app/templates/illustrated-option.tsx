import React from 'react';

import clsx from 'clsx';

import { Button, ButtonProps } from 'app/atoms/Button';
import { T, TID } from 'lib/i18n';

interface IllustratedOptionProps extends Omit<ButtonProps, 'title' | 'children'> {
  title: ReactChildren;
  descriptionI18nKey: TID;
  testID?: string;
  IllustrationAsset: string | ImportedSVGComponent;
}

export const IllustratedOption = ({
  title,
  descriptionI18nKey,
  testID,
  IllustrationAsset,
  className,
  ...restProps
}: IllustratedOptionProps) => (
  <Button
    className={clsx(
      className,
      'flex items-center gap-2 p-4 rounded-8 bg-white hover:bg-grey-4 border-0.5 border-lines'
    )}
    testID={testID}
    {...restProps}
  >
    {typeof IllustrationAsset === 'string' ? (
      <img src={IllustrationAsset} alt="" className="w-14 h-auto" />
    ) : (
      <IllustrationAsset className="w-14 h-auto" />
    )}
    <div className="flex-1 flex flex-col gap-1 text-left">
      <div className="text-font-medium-bold text-black">{title}</div>
      <p className="text-font-description text-grey-1">
        <T id={descriptionI18nKey} />
      </p>
    </div>
  </Button>
);

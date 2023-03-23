import React, { HTMLAttributes } from 'react';

import { T, TID } from 'lib/i18n';

interface Props extends HTMLAttributes<HTMLDivElement> {
  titleI18nKey: TID;
  descriptionI18nKey: TID;
}

export const GeneralSettingLabel = ({ titleI18nKey, descriptionI18nKey, ...props }: Props) => {
  return (
    <div className="mb-4 leading-tight flex flex-col" {...props}>
      <span className="text-base font-semibold text-gray-700">
        <T id={titleI18nKey} />
      </span>

      <span className="mt-1 text-xs font-light text-gray-600 max-w-9/10">
        <T id={descriptionI18nKey} />
      </span>
    </div>
  );
};

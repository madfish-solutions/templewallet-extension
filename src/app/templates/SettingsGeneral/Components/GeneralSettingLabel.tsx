import React from 'react';

import { T, TID } from 'lib/i18n';

interface Props {
  titleI18nKey: TID;
  descriptionI18nKey: TID;
}

export const GeneralSettingLabel = ({ titleI18nKey, descriptionI18nKey }: Props) => {
  return (
    <label className="mb-4 leading-tight flex flex-col" htmlFor="popupEnabled">
      <span className="text-base font-semibold text-gray-700">
        <T id={titleI18nKey} />
      </span>

      <span className="mt-1 text-xs font-light text-gray-600 max-w-9/10">
        <T id={descriptionI18nKey} />
      </span>
    </label>
  );
};

import React, { useMemo, useCallback, FC, useState } from 'react';

import classNames from 'clsx';
import browser from 'webextension-polyfill';

import Flag from 'app/atoms/Flag';
import { InputGeneral } from 'app/templates/InputGeneral/InputGeneral';
import { SelectGeneral } from 'app/templates/InputGeneral/SelectGeneral';
import { AnalyticsEventCategory, AnalyticsEventEnum, setTestID, useAnalytics } from 'lib/analytics';
import { getCurrentLocale, updateLocale, T } from 'lib/i18n';
import { searchAndFilterItems } from 'lib/utils/search-items';

import { SettingsGeneralSelectors } from '../selectors';

type LocaleSelectProps = {
  className?: string;
};

type LocaleOption = {
  code: string;
  disabled: boolean;
  flagName: string;
  label: string;
};

const LOCALE_OPTIONS: LocaleOption[] = [
  {
    code: 'en',
    flagName: 'us',
    label: 'English',
    disabled: false
  },
  {
    code: 'en_GB',
    flagName: 'gb',
    label: 'English ‒ United Kingdom',
    disabled: false
  },
  {
    code: 'fr',
    flagName: 'fr',
    label: 'French (Français)',
    disabled: false
  },
  {
    code: 'de',
    flagName: 'de',
    label: 'German (Deutsch)',
    disabled: false
  },
  {
    code: 'zh_CN',
    flagName: 'cn',
    label: 'Chinese ‒ Simplified (简体中文)',
    disabled: false
  },
  {
    code: 'zh_TW',
    flagName: 'tw',
    label: 'Chinese ‒ Traditional (繁體中文)',
    disabled: false
  },
  {
    code: 'ja',
    flagName: 'jp',
    label: 'Japanese (日本語)',
    disabled: false
  },
  {
    code: 'ko',
    flagName: 'kr',
    label: 'Korean',
    disabled: false
  },
  {
    code: 'uk',
    flagName: 'ua',
    label: 'Ukrainian (Українська)',
    disabled: false
  },
  {
    code: 'tr',
    flagName: 'tr',
    label: 'Turkish (Türk)',
    disabled: false
  },
  {
    code: 'pt',
    flagName: 'pt',
    label: 'Portuguese (Português)',
    disabled: false
  },
  // Disabled
  {
    code: 'ru',
    flagName: 'ru',
    label: 'Russian (Русский)',
    disabled: true
  }
];

const LocaleSelect: FC<LocaleSelectProps> = () => {
  const selectedLocale = getCurrentLocale();
  const { trackEvent } = useAnalytics();
  const [searchValue, setSearchValue] = useState<string>('');

  const options = useMemo(
    () =>
      searchAndFilterItems(LOCALE_OPTIONS, searchValue, [
        { name: 'code', weight: 0.75 },
        { name: 'flagName', weight: 1 },
        { name: 'label', weight: 0.5 }
      ]),
    [searchValue]
  );

  const value = useMemo(
    () => options.find(({ code }) => code === selectedLocale) ?? LOCALE_OPTIONS[0],
    [selectedLocale]
  );

  const handleLocaleChange = useCallback(
    ({ code }: LocaleOption) => {
      trackEvent(AnalyticsEventEnum.LanguageChanged, AnalyticsEventCategory.ButtonPress, { code });
      updateLocale(code);
    },
    [trackEvent]
  );

  return (
    <div className="mb-8">
      <InputGeneral
        header={<LocaleTitle />}
        mainContent={
          <SelectGeneral
            testIds={{
              dropdownTestId: SettingsGeneralSelectors.languageDropDown
            }}
            optionsListClassName="p-2"
            dropdownButtonClassName="p-3"
            DropdownFaceContent={<LocaleFieldContent {...value} />}
            optionsProps={{
              options,
              noItemsText: 'No items',
              renderOptionContent: option => renderOptionContent(option, option.code === value.code),
              onOptionChange: handleLocaleChange
            }}
            searchProps={{
              searchValue,
              onSearchChange: event => setSearchValue(event?.target.value)
            }}
          />
        }
      />
    </div>
  );
};

export default LocaleSelect;

const LocaleTitle: FC = () => (
  <h2 className="leading-tight flex flex-col">
    <span className="text-base font-semibold text-gray-700">
      <T id="languageAndCountry" />
    </span>
  </h2>
);

interface LocaleOptionContentProps {
  option: LocaleOption;
  isSelected?: boolean;
}

const LocaleIcon: FC<LocaleOptionContentProps> = ({ option: { flagName, code } }) => (
  <Flag alt={code} className="ml-2 mr-3" src={browser.runtime.getURL(`/misc/country-flags/${flagName}.svg`)} />
);

const LocaleFieldContent = (option: LocaleOption) => (
  <div className="flex items-center">
    <LocaleIcon option={option} />

    <span className="text-xl text-gray-700">{option.label}</span>
  </div>
);

const LocaleOptionContent: FC<LocaleOptionContentProps> = ({ option, isSelected }) => {
  return (
    <div
      className={classNames(
        'flex items-center py-1.5 px-2 rounded',
        isSelected ? 'bg-gray-200' : 'hover:bg-gray-100',
        option.disabled && 'opacity-25 cursor-default'
      )}
      {...setTestID(SettingsGeneralSelectors.languageitem)}
    >
      <LocaleIcon option={option} />

      <div className="relative w-full text-lg text-gray-700">
        {option.label}

        {option.disabled && (
          <div className="absolute top-0 bottom-0 right-0 flex items-center">
            <div className="mr-2 px-1 bg-orange-500 rounded-sm shadow-md text-white text-xs font-semibold uppercase">
              <T id="soon" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const renderOptionContent = (option: LocaleOption, isSelected: boolean) => (
  <LocaleOptionContent option={option} isSelected={isSelected} />
);

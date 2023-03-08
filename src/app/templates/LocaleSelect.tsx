import React, { useMemo, useCallback, FC } from 'react';

import browser from 'webextension-polyfill';

import Flag from 'app/atoms/Flag';
import { AnalyticsEventCategory, AnalyticsEventEnum, useAnalytics } from 'lib/analytics';
import { getCurrentLocale, updateLocale, T, t } from 'lib/i18n';
import { searchAndFilterItems } from 'lib/utils/search-items';

import IconifiedSelect, { IconifiedSelectOptionRenderProps } from './IconifiedSelect';

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

const localeIsDisabled = ({ disabled }: LocaleOption) => !!disabled;

const getLocaleCode = ({ code }: LocaleOption) => code;

const LocaleSelect: FC<LocaleSelectProps> = ({ className }) => {
  const selectedLocale = getCurrentLocale();
  const { trackEvent } = useAnalytics();

  const value = useMemo(
    () => LOCALE_OPTIONS.find(({ code }) => code === selectedLocale) || LOCALE_OPTIONS[0],
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
    <IconifiedSelect
      BeforeContent={LocaleTitle}
      FieldContent={LocaleFieldContent}
      OptionContent={LocaleOptionContent}
      getKey={getLocaleCode}
      isDisabled={localeIsDisabled}
      onChange={handleLocaleChange}
      options={LOCALE_OPTIONS}
      value={value}
      noItemsText={t('noItemsFound')}
      className={className}
      padded
      fieldStyle={{ minHeight: '3.375rem' }}
      search={{ filterItems: searchLocale }}
    />
  );
};

export default LocaleSelect;

const LocaleTitle: FC = () => (
  <h2 className="mb-4 leading-tight flex flex-col">
    <span className="text-base font-semibold text-gray-700">
      <T id="languageAndCountry" />
    </span>
  </h2>
);

type SelectItemProps = IconifiedSelectOptionRenderProps<LocaleOption>;

const LocaleIcon: FC<SelectItemProps> = ({ option: { flagName, code } }) => (
  <Flag alt={code} className="ml-2 mr-3" src={browser.runtime.getURL(`/misc/country-flags/${flagName}.svg`)} />
);

const LocaleFieldContent: FC<SelectItemProps> = ({ option }) => {
  return (
    <>
      <LocaleIcon option={option} />

      <span className="text-xl text-gray-700">{option.label}</span>
    </>
  );
};

const LocaleOptionContent: FC<SelectItemProps> = ({ option }) => {
  return (
    <>
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
    </>
  );
};

const searchLocale = (searchString: string) =>
  searchAndFilterItems(LOCALE_OPTIONS, searchString, [
    { name: 'code', weight: 0.75 },
    { name: 'flagName', weight: 1 },
    { name: 'label', weight: 0.5 }
  ]);

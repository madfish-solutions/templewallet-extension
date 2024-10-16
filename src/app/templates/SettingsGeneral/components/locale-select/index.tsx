import React, { memo, useCallback, useMemo } from 'react';

import { CellPartProps, SelectWithModal } from 'app/templates/select-with-modal';
import { AnalyticsEventCategory, AnalyticsEventEnum, useAnalytics } from 'lib/analytics';
import { getCurrentLocale, t, updateLocale } from 'lib/i18n';

import { SettingsGeneralSelectors } from '../../selectors';

import { LocaleIcon } from './locale-icon';
import { LOCALE_OPTIONS, LocaleOption } from './options';

const searchKeys = [
  { name: 'code', weight: 0.75 },
  { name: 'flagName', weight: 1 },
  { name: 'label', weight: 0.5 }
];

const localeOptionKeyFn = ({ code }: LocaleOption) => code;

const CellName = ({ option: { label } }: CellPartProps<{ label: string }>) => <span>{label}</span>;

const makeOptionWithLabel = (option: LocaleOption) => ({ ...option, label: t(`${option.code}LangName`) });

export const LocaleSelect = memo(() => {
  const selectedLocale = getCurrentLocale();
  const { trackEvent } = useAnalytics();

  const options = useMemo(() => LOCALE_OPTIONS.map(makeOptionWithLabel), []);
  const value = useMemo(
    () => options.find(({ code }) => code === selectedLocale) ?? makeOptionWithLabel(LOCALE_OPTIONS[0]),
    [options, selectedLocale]
  );

  const handleLocaleChange = useCallback(
    ({ code }: LocaleOption) => {
      trackEvent(AnalyticsEventEnum.LanguageChanged, AnalyticsEventCategory.ButtonPress, { code });
      updateLocale(code);
    },
    [trackEvent]
  );

  return (
    <SelectWithModal
      title={t('language')}
      options={options}
      value={value}
      searchKeys={searchKeys}
      keyFn={localeOptionKeyFn}
      CellIcon={LocaleIcon}
      CellName={CellName}
      onSelect={handleLocaleChange}
      testID={SettingsGeneralSelectors.languageDropDown}
      itemTestID={SettingsGeneralSelectors.languageItem}
    />
  );
});

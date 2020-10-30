import React, { useMemo, useCallback } from "react";
import classNames from "clsx";
import { browser } from "webextension-polyfill-ts";
import { getCurrentLocale, T, updateLocale } from "lib/i18n/react";
import Flag from "app/atoms/Flag";
import IconifiedSelect, {
  IconifiedSelectOptionRenderProps,
} from "./IconifiedSelect";

type LocaleSelectProps = {
  className?: string;
};

type LocaleOption = {
  code: string;
  flagName: string;
  label: string;
};

const localeOptions: LocaleOption[] = [
  {
    code: "en",
    flagName: "us",
    label: "English",
  },
  {
    code: "ru",
    flagName: "ru",
    label: "Russian (Русский)",
  },
];

const getLocaleCode = ({ code }: LocaleOption) => code;

const LocaleSelect: React.FC<LocaleSelectProps> = ({ className }) => {
  const selectedLocale = getCurrentLocale();

  const value = useMemo(
    () =>
      localeOptions.find(({ code }) => code === selectedLocale) ||
      localeOptions[0],
    [selectedLocale]
  );

  const title = useMemo(
    () => (
      <h2 className={classNames("mb-4", "leading-tight", "flex flex-col")}>
        <span className="text-base font-semibold text-gray-700">
          <T id="languageAndCountry" />
        </span>
      </h2>
    ),
    []
  );

  const handleLocaleChange = useCallback((option: LocaleOption) => {
    updateLocale(option.code);
  }, []);

  return (
    <IconifiedSelect
      Icon={LocaleIcon}
      OptionSelectedIcon={LocaleIcon}
      OptionInMenuContent={LocaleInMenuContent}
      OptionSelectedContent={LocaleSelectContent}
      getKey={getLocaleCode}
      options={localeOptions}
      value={value}
      onChange={handleLocaleChange}
      title={title}
      className={className}
    />
  );
};

export default LocaleSelect;

const LocaleIcon: React.FC<IconifiedSelectOptionRenderProps<LocaleOption>> = ({
  option: { flagName, code },
}) => (
  <Flag
    alt={code}
    className="ml-2 mr-3"
    src={browser.runtime.getURL(`/misc/country-flags/${flagName}.svg`)}
  />
);

const LocaleInMenuContent: React.FC<IconifiedSelectOptionRenderProps<
  LocaleOption
>> = ({ option }) => {
  return <span className="text-lg text-gray-700">{option.label}</span>;
};

const LocaleSelectContent: React.FC<IconifiedSelectOptionRenderProps<
  LocaleOption
>> = ({ option }) => {
  return (
    <div className="flex flex-col items-start py-2">
      <span className="text-xl text-gray-700">{option.label}</span>
    </div>
  );
};

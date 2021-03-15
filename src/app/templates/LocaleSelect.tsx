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
  disabled: boolean;
  flagName: string;
  label: string;
};

const localeOptions: LocaleOption[] = [
  {
    code: "en",
    flagName: "us",
    label: "English",
    disabled: false,
  },
  {
    code: "en_GB",
    flagName: "gb",
    label: "English ‒ United Kingdom",
    disabled: false,
  },
  {
    code: "fr",
    flagName: "fr",
    label: "French (Français)",
    disabled: false,
  },
  {
    code: "zh_CN",
    flagName: "cn",
    label: "Chinese ‒ China (普通话)",
    disabled: false,
  },
  {
    code: "zh_TW",
    flagName: "tw",
    label: "Chinese ‒ Taiwan (臺灣話)",
    disabled: false,
  },
  {
    code: "ja",
    flagName: "jp",
    label: "Japanese (日本語)",
    disabled: false,
  },
  {
    code: "ko",
    flagName: "kr",
    label: "Korean",
    disabled: false,
  },
  {
    code: "uk",
    flagName: "ua",
    label: "Ukrainian (Українська)",
    disabled: false,
  },
  // Disabled
  {
    code: "ru",
    flagName: "ru",
    label: "Russian (Русский)",
    disabled: true,
  },
];

const localeIsDisabled = ({ disabled }: LocaleOption) => !!disabled;

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
      isDisabled={localeIsDisabled}
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

const LocaleInMenuContent: React.FC<
  IconifiedSelectOptionRenderProps<LocaleOption>
> = ({ option: { disabled, label } }) => {
  return (
    <div className={classNames("relative w-full text-lg text-gray-700")}>
      {label}

      {disabled && (
        <div
          className={classNames(
            "absolute top-0 bottom-0 right-0",
            "flex items-center"
          )}
        >
          <div
            className={classNames(
              "mr-2 px-1",
              "bg-orange-500 rounded-sm shadow-md",
              "text-white",
              "text-xs font-semibold uppercase"
            )}
          >
            <T id="soon" />
          </div>
        </div>
      )}
    </div>
  );
};

const LocaleSelectContent: React.FC<
  IconifiedSelectOptionRenderProps<LocaleOption>
> = ({ option }) => {
  return (
    <div className="flex flex-col items-start py-2">
      <span className="text-xl text-gray-700">{option.label}</span>
    </div>
  );
};

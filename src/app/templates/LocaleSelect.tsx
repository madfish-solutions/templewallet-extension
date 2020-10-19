import React, { useMemo, useCallback } from "react";
import classNames from "clsx";
import { ThanosSharedStorageKey, useStorage } from "lib/thanos/front";
import { getUILanguageFallback, T } from "lib/ui/i18n";
import { ReactComponent as USFlag } from "app/misc/country-flags/us.svg";
import { ReactComponent as RUFlag } from "app/misc/country-flags/ru.svg";
import IconifiedSelect, {
  IconifiedSelectOptionRenderProps,
} from "./IconifiedSelect";

type LocaleSelectProps = {
  className?: string;
};

type LocaleOption = {
  code: string;
  Flag: React.ComponentType<React.HTMLAttributes<unknown>>;
  label: string;
};

const localeOptions: LocaleOption[] = [
  {
    code: "en",
    Flag: USFlag,
    label: "English",
  },
  {
    code: "ru",
    Flag: RUFlag,
    label: "Russian (Русский)",
  },
];

const getLocaleCode = ({ code }: LocaleOption) => code;

const LocaleSelect: React.FC<LocaleSelectProps> = ({ className }) => {
  const [selectedLocale, setLocale] = useStorage(
    ThanosSharedStorageKey.LocaleCode,
    getUILanguageFallback()
  );

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

  const handleLocaleChange = useCallback(
    (option: LocaleOption) => {
      setLocale(option.code);
    },
    [setLocale]
  );

  return (
    <IconifiedSelect
      Icon={LocaleIcon}
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
  option: { Flag },
}) => <Flag className="h-8 w-auto" />;

const LocaleInMenuContent: React.FC<IconifiedSelectOptionRenderProps<
  LocaleOption
>> = ({ option }) => {
  return <span className="text-gray-700 text-lg">{option.label}</span>;
};

const LocaleSelectContent: React.FC<IconifiedSelectOptionRenderProps<
  LocaleOption
>> = ({ option }) => {
  return (
    <div className="flex flex-col items-start">
      <span className="text-xl text-gray-700">{option.label}</span>
    </div>
  );
};

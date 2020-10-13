import classNames from "clsx";
import React, { useCallback } from "react";
import { getUILanguageWithFallback, supportedLocales } from "lib/ui/i18n";
import { ThanosSharedStorageKey, useStorage } from "lib/thanos/front";
import Popper, { PopperRenderProps } from "lib/ui/Popper";
import DropdownWrapper from "app/atoms/DropdownWrapper";
import { ReactComponent as ChevronDownIcon } from "app/icons/chevron-down.svg";
import Name from "app/atoms/Name";

type LanguageSelectProps = React.HTMLAttributes<HTMLDivElement>;

const LanguageSelect: React.FC<LanguageSelectProps> = () => {
  const [selectedLocale, setLocale] = useStorage(
    ThanosSharedStorageKey.LocaleCode,
    getUILanguageWithFallback()
  );

  return (
    <Popper
      placement="bottom-end"
      strategy="fixed"
      popup={({ opened, setOpened, toggleOpened }) => (
        <LanguageSelectMenu
          opened={opened}
          setOpened={setOpened}
          toggleOpened={toggleOpened}
          onChange={setLocale}
          selectedLocale={selectedLocale}
        />
      )}
    >
      {({ ref, opened, toggleOpened }) => (
        <button
          ref={ref}
          className={classNames(
            "px-2 py-1 mr-2",
            "bg-white bg-opacity-10 rounded",
            "border border-primary-orange border-opacity-25",
            "text-primary-white text-shadow-black",
            "text-xs font-medium",
            "transition ease-in-out duration-200",
            opened ? "shadow-md" : "shadow hover:shadow-md focus:shadow-md",
            opened
              ? "opacity-100"
              : "opacity-90 hover:opacity-100 focus:opacity-100",
            "flex items-center",
            "select-none"
          )}
          onClick={toggleOpened}
        >
          <Name style={{ maxWidth: "7rem" }}>
            {selectedLocale.toUpperCase()}
          </Name>

          <ChevronDownIcon
            className="ml-1 -mr-1 stroke-current stroke-2"
            style={{ height: 16, width: "auto" }}
          />
        </button>
      )}
    </Popper>
  );
};

export default LanguageSelect;

type LanguageSelectMenuProps = PopperRenderProps & {
  onChange: (newLocale: string) => void;
  selectedLocale: string;
};

const LanguageSelectMenu: React.FC<LanguageSelectMenuProps> = (props) => {
  const { opened, setOpened, onChange, selectedLocale } = props;
  const handleOptionClick = useCallback(
    (locale: string) => {
      if (selectedLocale !== locale) {
        onChange(locale);
      }
      setOpened(false);
    },
    [onChange, selectedLocale, setOpened]
  );

  return (
    <DropdownWrapper opened={opened} className="origin-top-right">
      {supportedLocales.map((localeCode) => (
        <LocaleOption
          key={localeCode}
          locale={localeCode}
          selected={localeCode === selectedLocale}
          onClick={handleOptionClick}
        />
      ))}
    </DropdownWrapper>
  );
};

type LocaleOptionProps = {
  locale: string;
  selected: boolean;
  onClick: (locale: string) => void;
};

export const LocaleOption: React.FC<LocaleOptionProps> = (props) => {
  const { locale, selected, onClick } = props;

  const handleClick = useCallback(() => {
    onClick(locale);
  }, [locale, onClick]);

  return (
    <button
      key={locale}
      className={classNames(
        "w-full",
        "mb-1",
        "rounded",
        "transition easy-in-out duration-200",
        selected
          ? "bg-white bg-opacity-10"
          : "hover:bg-white hover:bg-opacity-5",
        "cursor-pointer",
        "flex items-center"
      )}
      style={{
        padding: "0.375rem 1.5rem 0.375rem 0.5rem",
      }}
      autoFocus={selected}
      onClick={handleClick}
    >
      <span
        className="overflow-hidden text-sm text-white whitespace-no-wrap text-shadow-black"
        style={{ textOverflow: "ellipsis", maxWidth: "10rem" }}
      >
        {locale.toUpperCase()}
      </span>
    </button>
  );
};

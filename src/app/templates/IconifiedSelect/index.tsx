import React, { useMemo, useState } from 'react';

import { Modifier } from '@popperjs/core';
import { useDebounce } from 'use-debounce';

import Popper from 'lib/ui/Popper';

import { FieldContainer, FieldInnerComponent, IconifiedSelectField } from './Field';
import { IconifiedSelectMenu } from './Menu';
import { IconifiedSelectProps } from './types';

export type { IconifiedSelectOptionRenderProps } from './types';

const IconifiedSelectWithSearch = <T extends unknown>({
  Icon,
  OptionInMenuContent,
  OptionSelectedIcon,
  OptionSelectedContent,
  getKey,
  isDisabled,
  options,
  value,
  onChange,
  className,
  title,
  padded,
  fieldStyle,
  search
}: IconifiedSelectProps<T>) => {
  const [searchString, setSearchString] = useState<string>();

  const [searchStringDebounced] = useDebounce(searchString, 300);

  const searchedOptions = useMemo(() => {
    if (!search || !searchStringDebounced) return options;

    return search.filterItems(searchStringDebounced);
  }, [searchStringDebounced, options]);

  return (
    <div className={className}>
      {title}

      {options.length > 1 ? (
        <Popper
          placement="bottom"
          strategy="fixed"
          modifiers={[sameWidth]}
          popup={({ opened, setOpened, toggleOpened }) => (
            <IconifiedSelectMenu
              isDisabled={isDisabled}
              opened={opened}
              setOpened={setOpened}
              toggleOpened={toggleOpened}
              onChange={onChange}
              Icon={Icon}
              OptionInMenuContent={OptionInMenuContent}
              getKey={getKey}
              options={searchedOptions}
              value={value}
              padded={padded}
              withSearch={!!search}
            />
          )}
        >
          {({ ref, opened, toggleOpened }) => (
            <IconifiedSelectField
              ref={ref as unknown as React.RefObject<HTMLDivElement>}
              Content={OptionSelectedContent}
              Icon={OptionSelectedIcon}
              opened={opened}
              value={value}
              dropdown
              style={fieldStyle}
              onClick={toggleOpened}
              search={
                search
                  ? {
                      value: searchString,
                      placeholder: search?.placeholder,
                      onChange: setSearchString
                    }
                  : undefined
              }
            />
          )}
        </Popper>
      ) : (
        <FieldContainer active={false}>
          <FieldInnerComponent Icon={OptionSelectedIcon} Content={OptionSelectedContent} value={value} />
        </FieldContainer>
      )}
    </div>
  );
};

export default IconifiedSelectWithSearch;

const sameWidth: Modifier<string, any> = {
  name: 'sameWidth',
  enabled: true,
  phase: 'beforeWrite',
  requires: ['computeStyles'],
  fn: ({ state }) => {
    state.styles.popper.width = `${state.rects.reference.width}px`;
  },
  effect: ({ state }) => {
    state.elements.popper.style.width = `${(state.elements.reference as any).offsetWidth}px`;
    return () => {};
  }
};

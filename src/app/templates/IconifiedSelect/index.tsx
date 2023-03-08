import React, { useMemo, useState } from 'react';

import { Modifier } from '@popperjs/core';
import { useDebounce } from 'use-debounce';

import Popper from 'lib/ui/Popper';

import { FieldContainer, FieldInnerComponent, IconifiedSelectField } from './Field';
import { IconifiedSelectMenu } from './Menu';
import { IconifiedSelectProps } from './types';

export type { IconifiedSelectOptionRenderProps } from './types';

const IconifiedSelect = <T extends unknown>({
  FieldContent,
  OptionContent,
  BeforeContent,
  getKey,
  isDisabled,
  onChange,
  options,
  value,
  noItemsText,
  className,
  padded,
  fieldStyle,
  search
}: IconifiedSelectProps<T>) => {
  const [searchString, setSearchString] = useState<string>();

  const [searchStringDebounced] = useDebounce(searchString, 300);

  const searchedOptions = useMemo(() => {
    if (!search) return options;

    return search.filterItems(searchStringDebounced || '');
  }, [searchStringDebounced, options]);

  if (options.length < 2)
    return (
      <div className={className}>
        <FieldContainer active={false} BeforeContent={BeforeContent}>
          <FieldInnerComponent Content={FieldContent} value={value} />
        </FieldContainer>
      </div>
    );

  return (
    <div className={className}>
      <Popper
        placement="bottom"
        strategy="fixed"
        modifiers={[sameWidth]}
        popup={({ opened, setOpened, toggleOpened }) => (
          <IconifiedSelectMenu
            isDisabled={isDisabled}
            setOpened={setOpened}
            toggleOpened={toggleOpened}
            getKey={getKey}
            onChange={onChange}
            OptionContent={OptionContent}
            opened={opened}
            options={searchedOptions}
            value={value}
            padded={padded}
            noItemsText={noItemsText}
            search={
              search && {
                value: searchString
              }
            }
          />
        )}
      >
        {({ ref, opened, toggleOpened }) => (
          <IconifiedSelectField
            ref={ref as unknown as React.RefObject<HTMLDivElement>}
            Content={FieldContent}
            BeforeContent={BeforeContent}
            opened={opened}
            value={value}
            dropdown
            style={fieldStyle}
            onClick={toggleOpened}
            search={
              search && {
                value: searchString,
                placeholder: search?.placeholder,
                onChange: setSearchString
              }
            }
          />
        )}
      </Popper>
    </div>
  );
};

export default IconifiedSelect;

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

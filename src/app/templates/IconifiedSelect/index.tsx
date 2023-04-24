import React, { useMemo, useState } from 'react';

import { useDebounce } from 'use-debounce';

import Popper from 'lib/ui/Popper';
import { sameWidthModifiers } from 'lib/ui/same-width-modifiers';

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
  search,
  testID
}: IconifiedSelectProps<T>) => {
  const [searchString, setSearchString] = useState<string>();

  const [searchStringDebounced] = useDebounce(searchString, 300);

  const searchedOptions = useMemo(
    () => (search && searchStringDebounced ? search.filterItems(searchStringDebounced) : options),
    [search?.filterItems, searchStringDebounced, options]
  );

  if (options.length < 2)
    return (
      <div className={className}>
        <FieldContainer active={false} BeforeContent={BeforeContent}>
          <FieldInnerComponent Content={FieldContent} value={value} testID={testID} />
        </FieldContainer>
      </div>
    );

  return (
    <div className={className}>
      <Popper
        placement="bottom"
        strategy="fixed"
        modifiers={sameWidthModifiers}
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
            testID={testID}
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
            testID={testID}
            search={
              search && {
                value: searchString,
                placeholder: search?.placeholder,
                onChange: setSearchString,
                inputTestID: search.inputTestID
              }
            }
          />
        )}
      </Popper>
    </div>
  );
};

export default IconifiedSelect;

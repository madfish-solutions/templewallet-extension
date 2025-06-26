import React, { FC, useCallback, useRef, useEffect } from 'react';

import clsx from 'clsx';

import { ReactComponent as CopyIcon } from 'app/icons/base/copy.svg';
import { setTestID, TestIDProperty } from 'lib/analytics';
import { TID, T } from 'lib/i18n';
import { selectNodeContent } from 'lib/ui/content-selection';
import { useFocusHandlers } from 'lib/ui/hooks/use-focus-handlers';

import { CopyButton } from './CopyButton';
import { FieldLabel } from './FieldLabel';
import { FORM_FIELD_CLASS_NAME } from './FormField';
import { IconBase } from './IconBase';
import { SecretCover } from './SecretCover';

interface ReadOnlySecretFieldProps extends TestIDProperty {
  label: TID;
  labelSubstitutions?: any;
  description: React.ReactNode;
  value: string;
  secretCoverTestId?: string;
}

export const ReadOnlySecretField: FC<ReadOnlySecretFieldProps> = ({
  value,
  label,
  labelSubstitutions,
  description,
  testID,
  secretCoverTestId
}) => {
  const { isFocused: focused, onFocus: handleFocus, onBlur: handleBlur } = useFocusHandlers();
  const {
    isFocused: copyButtonFocused,
    onFocus: handleCopyButtonFocus,
    onBlur: handleCopyButtonBlur
  } = useFocusHandlers();

  const fieldRef = useRef<HTMLParagraphElement>(null);

  const onSecretCoverClick = useCallback(() => {
    fieldRef.current?.focus();
  }, []);

  const covered = !focused && !copyButtonFocused;

  useEffect(() => {
    if (!covered) selectNodeContent(fieldRef.current);
  }, [covered]);

  return (
    <div className="w-full flex flex-col">
      <FieldLabel
        label={<T id={label} substitutions={labelSubstitutions} />}
        description={description}
        className="mb-2 mt-1 mx-1"
      />

      <div className="relative flex items-stretch">
        <p
          ref={fieldRef}
          tabIndex={0}
          className={clsx(FORM_FIELD_CLASS_NAME, 'h-40 break-words py-3 px-4 overflow-y-auto border-input-low')}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...setTestID(testID)}
        >
          {covered ? '' : value}
        </p>

        <CopyButton
          text={covered ? '' : value}
          isSecret
          className="text-secondary absolute right-3 bottom-3 flex text-font-description-bold items-center px-1 py-0.5"
          onFocus={handleCopyButtonFocus}
          onBlur={handleCopyButtonBlur}
        >
          <span>
            <T id="copy" />
          </span>
          <IconBase size={12} Icon={CopyIcon} />
        </CopyButton>

        {covered && <SecretCover onClick={onSecretCoverClick} testID={secretCoverTestId} />}
      </div>
    </div>
  );
};

import React, {
  forwardRef,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState
} from 'react';

import clsx from 'clsx';

import CleanButton from 'app/atoms/CleanButton';
import CopyButton from 'app/atoms/CopyButton';
import { ReactComponent as PasteFillIcon } from 'app/icons/base/paste_fill.svg';
import { ReactComponent as CopyIcon } from 'app/icons/monochrome/copy.svg';
import { setTestID, TestIDProperty } from 'lib/analytics';
import { useDidUpdate } from 'lib/ui/hooks';
import { blurHandler, focusHandler, inputChangeHandler } from 'lib/ui/inputHandlers';
import { useBlurElementOnTimeout } from 'lib/ui/use-blur-on-timeout';
import useCopyToClipboard from 'lib/ui/useCopyToClipboard';
import { combineRefs } from 'lib/ui/utils';

import { Button } from './Button';
import { ErrorCaptionSelectors } from './ErrorCaption.selectors';
import { FieldLabel } from './FieldLabel';
import { IconBase } from './IconBase';
import { SecretCover } from './SecretCover';
import usePasswordToggle from './usePasswordToggle.hook';

export const PASSWORD_ERROR_CAPTION = 'PASSWORD_ERROR_CAPTION';

export type FormFieldElement = HTMLInputElement | HTMLTextAreaElement;
type FormFieldAttrs = InputHTMLAttributes<HTMLInputElement> & TextareaHTMLAttributes<HTMLTextAreaElement>;

type InnerWrapperType = 'default' | 'none' | 'unset';

export interface FormFieldProps extends TestIDProperty, Omit<FormFieldAttrs, 'type' | 'onBlur'> {
  type?: 'text' | 'number' | 'password';
  extraSection?: ReactNode;
  label?: ReactNode;
  labelDescription?: ReactNode;
  labelWarning?: ReactNode;
  errorCaption?: ReactNode;
  shouldShowErrorCaption?: boolean;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  textarea?: boolean;
  /** `textarea=true` only */
  secret?: boolean;
  /** `textarea=true` only */
  showPasteButton?: boolean;
  /** `type='password'` only */
  revealForbidden?: boolean;
  /** `type='password'` only */
  shouldShowRevealWhenEmpty?: boolean;
  /**
   * Any value, whose change will result in password un-reveal.
   * `type='password'` only
   */
  revealRef?: unknown;
  cleanable?: boolean;
  extraLeftInner?: ReactNode;
  extraLeftInnerWrapper?: InnerWrapperType;
  extraRightInner?: ReactNode;
  extraRightInnerWrapper?: InnerWrapperType;
  onClean?: EmptyFn;
  onPasteButtonClick?: EmptyFn;
  onReveal?: EmptyFn;
  onBlur?: React.FocusEventHandler;
  smallPaddings?: boolean;
  fieldWrapperBottomMargin?: boolean;
  copyable?: boolean;
  testIDs?: {
    inputSection?: string;
    input?: string;
  };
  rightSideComponent?: ReactNode;
  underneathComponent?: ReactNode;
}

/**
 * TODO: Consider separating into two: `FormInputField` & `FormTextAreaField`
 */
export const FormField = forwardRef<FormFieldElement, FormFieldProps>(
  (
    {
      containerStyle,
      extraSection,
      label,
      labelDescription,
      labelWarning,
      errorCaption,
      shouldShowErrorCaption = true,
      containerClassName,
      textarea,
      secret: secretProp,
      revealForbidden = false,
      shouldShowRevealWhenEmpty = false,
      revealRef,
      cleanable,
      showPasteButton = false,
      extraLeftInner = null,
      extraLeftInnerWrapper = 'default',
      extraRightInner = null,
      extraRightInnerWrapper = 'default',
      id,
      type,
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      onClean,
      onPasteButtonClick,
      onReveal,
      className,
      rightSideComponent,
      underneathComponent,
      spellCheck = false,
      autoComplete = 'off',
      smallPaddings = false,
      fieldWrapperBottomMargin = true,
      copyable,
      testID,
      testIDs,
      style,
      ...rest
    },
    ref
  ) => {
    const secret = secretProp && textarea;
    const Field = textarea ? 'textarea' : 'input';

    const [passwordInputType, RevealPasswordIcon] = usePasswordToggle(id, onReveal, revealRef, onBlur);
    const isPasswordInput = type === 'password';
    const inputType = isPasswordInput ? passwordInputType : type;

    const { copy } = useCopyToClipboard();

    const [localValue, setLocalValue] = useState(value ?? defaultValue ?? '');
    useDidUpdate(() => void setLocalValue(value ?? ''), [value]);

    const [focused, setFocused] = useState(false);

    const handleChange = useCallback(
      (e: React.ChangeEvent<FormFieldElement>) => {
        inputChangeHandler(e, onChange, setLocalValue);
      },
      [onChange, setLocalValue]
    );

    const handleFocus = useCallback(
      (e: React.FocusEvent) => focusHandler(e, onFocus, setFocused),
      [onFocus, setFocused]
    );
    const handleBlur = useCallback((e: React.FocusEvent) => blurHandler(e, onBlur, setFocused), [onBlur, setFocused]);

    const secretCovered = useMemo(
      () => Boolean(secret && localValue !== '' && !focused),
      [secret, localValue, focused]
    );

    const spareRef = useRef<FormFieldElement>();

    useBlurElementOnTimeout(spareRef, focused && Boolean(secret || isPasswordInput));

    const handleSecretBannerClick = () => void spareRef.current?.focus();
    const handleCleanClick = useCallback(() => void onClean?.(), [onClean]);

    const hasRevealablePassword =
      isPasswordInput && !revealForbidden && (shouldShowRevealWhenEmpty || Boolean(localValue));
    const fieldStyle = useMemo(
      () => ({
        ...style,
        ...buildHorizontalPaddingStyle(
          [cleanable, copyable, hasRevealablePassword].filter(Boolean).length,
          extraLeftInnerWrapper === 'unset' ? false : Boolean(extraLeftInner),
          extraRightInnerWrapper === 'unset' ? false : Boolean(extraRightInner),
          smallPaddings
        )
      }),
      [
        cleanable,
        copyable,
        extraLeftInner,
        extraLeftInnerWrapper,
        extraRightInner,
        extraRightInnerWrapper,
        hasRevealablePassword,
        smallPaddings,
        style
      ]
    );

    return (
      <div
        className={clsx('w-full flex flex-col', containerClassName)}
        style={containerStyle}
        {...setTestID(testIDs?.inputSection)}
      >
        {label && (
          <FieldLabel
            label={label}
            warning={labelWarning}
            description={labelDescription}
            className="mt-1 pb-2"
            id={id}
          />
        )}

        {extraSection}

        <div className={clsx('relative flex items-stretch', fieldWrapperBottomMargin && 'mb-1')}>
          <ExtraInner
            innerComponent={extraLeftInner}
            useDefaultWrapper={extraLeftInnerWrapper === 'default'}
            position="left"
          />

          <Field
            ref={combineRefs(ref, spareRef)}
            className={clsx(
              FORM_FIELD_CLASS_NAME,
              smallPaddings ? 'py-2 pl-2' : 'p-3',
              errorCaption ? 'border-error' : 'border-input-low',
              className
            )}
            style={fieldStyle}
            id={id}
            type={inputType}
            value={value}
            defaultValue={defaultValue}
            spellCheck={spellCheck}
            autoComplete={autoComplete}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...rest}
            {...setTestID(testIDs?.input || testID)}
          />

          <ExtraInner
            innerComponent={extraRightInner}
            useDefaultWrapper={extraRightInnerWrapper === 'default'}
            position="right"
          />

          <div
            className={clsx(
              'absolute flex justify-end gap-1 items-center',
              textarea ? 'bottom-3' : 'inset-y-0',
              smallPaddings ? 'right-2' : 'right-3'
            )}
          >
            {cleanable && <CleanButton withText={textarea} size={textarea ? 12 : 16} onClick={handleCleanClick} />}
            {rightSideComponent && rightSideComponent}
            {textarea && !cleanable && showPasteButton && (
              <Button className="flex items-center text-secondary" onClick={onPasteButtonClick}>
                <span className="text-font-description-bold">Paste</span>
                <IconBase Icon={PasteFillIcon} size={12} onClick={handleCleanClick} />
              </Button>
            )}
            {copyable && <Copyable value={String(value)} copy={copy} isSecret={type === 'password'} />}
            {hasRevealablePassword && RevealPasswordIcon}
          </div>

          {secretCovered && <SecretCover onClick={handleSecretBannerClick} />}
        </div>

        {shouldShowErrorCaption && <ErrorCaption errorCaption={errorCaption} />}

        {!errorCaption && underneathComponent}
      </div>
    );
  }
);

export const FORM_FIELD_CLASS_NAME = clsx(
  'appearance-none w-full border rounded-lg bg-input-low caret-primary focus:outline-none',
  'transition ease-in-out duration-200 text-font-regular placeholder-grey-2 hover:placeholder-grey-1'
);

interface ExtraInnerProps {
  innerComponent: React.ReactNode;
  useDefaultWrapper: boolean;
  position: 'left' | 'right';
}

const ExtraInner: React.FC<ExtraInnerProps> = ({ useDefaultWrapper, innerComponent, position }) => {
  if (useDefaultWrapper)
    return (
      <div
        className={clsx(
          'absolute flex items-center inset-y-0 pointer-events-none',
          position === 'right' ? 'justify-end right-0 w-32 opacity-50' : 'justify-start left-0 w-10'
        )}
      >
        <div className="mx-4 text-lg font-light text-gray-900">{innerComponent}</div>
      </div>
    );
  return <>{innerComponent}</>;
};

interface CopyableProps {
  value: string;
  copy: EmptyFn;
  isSecret: boolean;
}

const Copyable: React.FC<CopyableProps> = ({ copy, value }) => (
  <CopyButton text={value} type="link">
    <CopyIcon
      style={{ verticalAlign: 'inherit' }}
      className="h-4 ml-1 w-auto inline stroke-orange-500 stroke-2"
      onClick={copy}
    />
  </CopyButton>
);

interface ErrorCaptionProps {
  errorCaption: React.ReactNode;
}

const ErrorCaption: React.FC<ErrorCaptionProps> = ({ errorCaption }) => {
  const isPasswordStrengthIndicator = errorCaption === PASSWORD_ERROR_CAPTION;

  return errorCaption && !isPasswordStrengthIndicator ? (
    <div className="text-xs text-red-500" {...setTestID(ErrorCaptionSelectors.inputError)}>
      {errorCaption}
    </div>
  ) : null;
};

const buildHorizontalPaddingStyle = (
  buttonsCount: number,
  withExtraInnerLeft: boolean,
  withExtraInnerRight: boolean,
  smallPaddings: boolean
) => ({
  paddingRight: withExtraInnerRight ? 128 : (smallPaddings ? 8 : 12) + buttonsCount * 28,
  paddingLeft: withExtraInnerLeft ? 40 : smallPaddings ? 8 : 12
});

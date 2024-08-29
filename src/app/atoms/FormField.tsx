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
import { noop } from 'lodash';

import CleanButton from 'app/atoms/CleanButton';
import OldStyleCopyButton from 'app/atoms/OldStyleCopyButton';
import { ReactComponent as CopyIcon } from 'app/icons/monochrome/copy.svg';
import { setTestID, TestIDProperty } from 'lib/analytics';
import { useDidUpdate } from 'lib/ui/hooks';
import { useFocusHandlers } from 'lib/ui/hooks/use-focus-handlers';
import { inputChangeHandler } from 'lib/ui/inputHandlers';
import { useBlurElementOnTimeout } from 'lib/ui/use-blur-on-timeout';
import useCopyToClipboard from 'lib/ui/useCopyToClipboard';
import { combineRefs } from 'lib/ui/utils';

import { ErrorCaptionSelectors } from './ErrorCaption.selectors';
import { FieldLabel } from './FieldLabel';
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
  warningCaption?: ReactNode;
  containerClassName?: string;
  labelContainerClassName?: string;
  containerStyle?: React.CSSProperties;
  textarea?: boolean;
  /** `textarea=true` only */
  secret?: boolean;
  /** `type='password'` only */
  revealForbidden?: boolean;
  /** `type='password'` only */
  shouldShowRevealWhenEmpty?: boolean;
  /**
   * Any value, whose change will result in password un-reveal.
   * `type='password'` only
   */
  revealRef?: unknown;
  additonalActionButtons?: ReactNode;
  cleanable?: boolean;
  extraLeftInner?: ReactNode;
  extraLeftInnerWrapper?: InnerWrapperType;
  extraRightInner?: ReactNode;
  extraRightInnerWrapper?: InnerWrapperType;
  onClean?: EmptyFn;
  onReveal?: EmptyFn;
  onBlur?: React.FocusEventHandler;
  smallPaddings?: boolean;
  fieldWrapperBottomMargin?: boolean;
  copyable?: boolean;
  testIDs?: {
    inputSection?: string;
    input?: string;
  };
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
      warningCaption,
      containerClassName,
      labelContainerClassName,
      textarea,
      secret: secretProp,
      revealForbidden = false,
      shouldShowRevealWhenEmpty = false,
      revealRef,
      cleanable,
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
      onClean = noop,
      onReveal,
      className,
      spellCheck = false,
      autoComplete = 'off',
      smallPaddings = false,
      fieldWrapperBottomMargin = true,
      additonalActionButtons,
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
    useDidUpdate(() => setLocalValue(value ?? ''), [value]);

    const { isFocused: focused, onFocus: handleFocus, onBlur: handleBlur } = useFocusHandlers(onFocus, onBlur);

    const handleChange = useCallback(
      (e: React.ChangeEvent<FormFieldElement>) => {
        inputChangeHandler(e, onChange, setLocalValue);
      },
      [onChange, setLocalValue]
    );

    const secretCovered = useMemo(
      () => Boolean(secret && localValue !== '' && !focused),
      [secret, localValue, focused]
    );

    const spareRef = useRef<FormFieldElement>();

    useBlurElementOnTimeout(spareRef, focused && Boolean(secret ?? isPasswordInput));

    const handleSecretBannerClick = () => spareRef.current?.focus();

    const hasRevealablePassword =
      isPasswordInput && !revealForbidden && (shouldShowRevealWhenEmpty || Boolean(localValue));
    const fieldStyle = useMemo(
      () => ({
        ...style,
        ...buildHorizontalPaddingStyle(
          [cleanable, copyable, hasRevealablePassword].filter(Boolean).length,
          extraLeftInnerWrapper === 'unset' ? false : Boolean(extraLeftInner),
          extraRightInnerWrapper === 'unset' ? false : Boolean(extraRightInner),
          smallPaddings,
          textarea
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
        style,
        textarea
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
            labelContainerClassName={labelContainerClassName}
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
            smallPaddings={smallPaddings}
          />

          <Field
            ref={combineRefs(ref, spareRef)}
            className={clsx(
              FORM_FIELD_CLASS_NAME,
              smallPaddings ? 'py-2 pl-2' : 'p-3',
              errorCaption ? 'border-error' : warningCaption ? 'border-warning' : 'border-input-low',
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
            {...setTestID(testIDs?.input ?? testID)}
          />

          <ExtraInner
            innerComponent={extraRightInner}
            useDefaultWrapper={extraRightInnerWrapper === 'default'}
            position="right"
            smallPaddings={smallPaddings}
          />

          <div
            className={clsx(
              'absolute flex justify-end gap-1 items-center',
              textarea ? (smallPaddings ? 'bottom-2' : 'bottom-3') : 'inset-y-0',
              smallPaddings ? 'right-2' : 'right-3'
            )}
          >
            {additonalActionButtons}
            {cleanable && <CleanButton size={textarea ? 12 : 16} onClick={onClean} showText={textarea} />}
            {copyable && <Copyable value={String(value)} copy={copy} isSecret={type === 'password'} />}
            {hasRevealablePassword && RevealPasswordIcon}
          </div>

          {secretCovered && <SecretCover onClick={handleSecretBannerClick} />}
        </div>

        {shouldShowErrorCaption && <ErrorCaption errorCaption={errorCaption} />}
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
  smallPaddings: boolean;
}

const ExtraInner: React.FC<ExtraInnerProps> = ({ useDefaultWrapper, innerComponent, position, smallPaddings }) => {
  if (useDefaultWrapper)
    return (
      <div
        className={clsx(
          'absolute flex items-center inset-y-0 pointer-events-none',
          position === 'left' && (smallPaddings ? 'w-8' : 'w-10'),
          position === 'right' ? 'justify-end right-0 w-32 opacity-50' : 'justify-start left-0'
        )}
      >
        <div className={clsx(smallPaddings ? 'mx-2' : 'mx-4', 'text-lg')}>{innerComponent}</div>
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
  <OldStyleCopyButton text={value} type="link">
    <CopyIcon
      style={{ verticalAlign: 'inherit' }}
      className="h-4 ml-1 w-auto inline stroke-orange-500 stroke-2"
      onClick={copy}
    />
  </OldStyleCopyButton>
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
  smallPaddings: boolean,
  textarea = false
) => {
  return {
    paddingRight: withExtraInnerRight ? 128 : (smallPaddings ? 8 : 12) + (textarea ? 0 : buttonsCount * 28),
    paddingLeft: withExtraInnerLeft ? (smallPaddings ? 32 : 40) : smallPaddings ? 8 : 12
  };
};

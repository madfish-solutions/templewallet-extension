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

import classNames from 'clsx';

import CleanButton from 'app/atoms/CleanButton';
import CopyButton from 'app/atoms/CopyButton';
import { ReactComponent as CopyIcon } from 'app/icons/copy.svg';
import { setTestID, TestIDProperty } from 'lib/analytics';
import { useDidUpdate } from 'lib/ui/hooks';
import { blurHandler, focusHandler, inputChangeHandler } from 'lib/ui/inputHandlers';
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

export interface FormFieldProps extends TestIDProperty, Omit<FormFieldAttrs, 'type'> {
  type?: 'text' | 'number' | 'password';
  extraSection?: ReactNode;
  label?: ReactNode;
  labelDescription?: ReactNode;
  labelWarning?: ReactNode;
  errorCaption?: ReactNode;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  textarea?: boolean;
  /** `textarea=true` only */
  secret?: boolean;
  /** `type='password'` only */
  revealForbidden?: boolean;
  /**
   * Any value, whose change will result in password un-reveal.
   * `type='password'` only
   */
  revealRef?: unknown;
  cleanable?: boolean;
  extraInner?: ReactNode;
  extraInnerWrapper?: 'default' | 'none' | 'unset';
  onClean?: EmptyFn;
  onReveal?: EmptyFn;
  smallPaddings?: boolean;
  fieldWrapperBottomMargin?: boolean;
  copyable?: boolean;
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
      containerClassName,
      textarea,
      secret: secretProp,
      revealForbidden = false,
      revealRef,
      cleanable,
      extraInner = null,
      extraInnerWrapper = 'default',
      id,
      type,
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      onClean,
      onReveal,
      className,
      spellCheck = false,
      autoComplete = 'off',
      smallPaddings = false,
      fieldWrapperBottomMargin = true,
      copyable,
      testID,
      ...rest
    },
    ref
  ) => {
    const secret = secretProp && textarea;
    const Field = textarea ? 'textarea' : 'input';

    const [passwordInputType, RevealPasswordIcon] = usePasswordToggle(smallPaddings, onReveal, revealRef);
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

    return (
      <div className={classNames('w-full flex flex-col', containerClassName)} style={containerStyle}>
        {label && (
          <FieldLabel label={label} warning={labelWarning} description={labelDescription} className="mb-4" id={id} />
        )}

        {extraSection}

        <div className={classNames('relative flex items-stretch', fieldWrapperBottomMargin && 'mb-2')}>
          <Field
            ref={combineRefs(ref, spareRef)}
            className={classNames(
              FORM_FIELD_CLASS_NAME,
              smallPaddings ? 'py-2 pl-2' : 'py-3 pl-4',
              buildPaddingRightClassName(
                isPasswordInput,
                extraInnerWrapper === 'unset' ? false : Boolean(extraInner),
                smallPaddings
              ),
              errorCaption ? 'border-red-500' : 'border-gray-300',
              className
            )}
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
            {...setTestID(testID)}
          />

          {isPasswordInput && !revealForbidden && localValue !== '' && RevealPasswordIcon}

          <ExtraInner innerComponent={extraInner} useDefaultWrapper={extraInnerWrapper === 'default'} />

          {secretCovered && <SecretCover onClick={handleSecretBannerClick} />}

          <Cleanable cleanable={cleanable} handleCleanClick={handleCleanClick} />
          <Copyable value={value} copy={copy} cleanable={cleanable} copyable={copyable} />
        </div>

        <ErrorCaption errorCaption={errorCaption} />
      </div>
    );
  }
);

export const FORM_FIELD_CLASS_NAME = classNames(
  'appearance-none w-full border-2 rounded-md bg-gray-100',
  'focus:border-primary-orange focus:bg-transparent focus:outline-none focus:shadow-outline',
  'transition ease-in-out duration-200',
  'text-gray-700 text-lg leading-tight placeholder-alphagray'
);

interface ExtraInnerProps {
  innerComponent: React.ReactNode;
  useDefaultWrapper: boolean;
}

const ExtraInner: React.FC<ExtraInnerProps> = ({ useDefaultWrapper, innerComponent }) => {
  if (useDefaultWrapper)
    return (
      <div
        className={classNames(
          'absolute flex items-center justify-end inset-y-0 right-0 w-32',
          'opacity-50 pointer-events-none overflow-hidden'
        )}
      >
        <span className="mx-4 text-lg font-light text-gray-900">{innerComponent}</span>
      </div>
    );
  return <>{innerComponent}</>;
};

interface CleanableProps {
  handleCleanClick: () => void;
  cleanable: React.ReactNode;
}

const Cleanable: React.FC<CleanableProps> = ({ cleanable, handleCleanClick }) =>
  cleanable ? <CleanButton onClick={handleCleanClick} /> : null;

interface CopyableProps {
  value: React.ReactNode;
  copy: () => void;
  cleanable: React.ReactNode;
  copyable: React.ReactNode;
}

const Copyable: React.FC<CopyableProps> = ({ copy, cleanable, value, copyable }) =>
  copyable ? (
    <CopyButton
      style={{
        position: 'absolute',
        bottom: cleanable ? '3px' : '0px',
        right: cleanable ? '30px' : '5px'
      }}
      text={value as string}
      type="link"
    >
      <CopyIcon
        style={{ verticalAlign: 'inherit' }}
        className="h-4 ml-1 w-auto inline stroke-orange stroke-2"
        onClick={() => copy()}
      />
    </CopyButton>
  ) : null;

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

const buildPaddingRightClassName = (isPasswordInput: boolean, withExtraInner: boolean, smallPaddings: boolean) => {
  if (withExtraInner) return 'pr-32';

  if (isPasswordInput) return smallPaddings ? 'pr-11' : 'pr-12';

  return smallPaddings ? 'pr-2' : 'pr-4';
};

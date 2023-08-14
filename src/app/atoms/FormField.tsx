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
import { blurHandler, focusHandler, inputChangeHandler } from 'lib/ui/inputHandlers';
import { useBlurElementOnTimeout } from 'lib/ui/use-blur-on-timeout';
import useCopyToClipboard from 'lib/ui/useCopyToClipboard';
import { combineRefs } from 'lib/ui/util';

import { NewSeedBackupSelectors } from '../pages/NewWallet/create/NewSeedBackup/NewSeedBackup.selectors';
import { ErrorCaptionSelectors } from './ErrorCaption.selectors';
import { FieldLabel } from './FieldLabel';
import { SecretCover } from './SecretCover';
import usePasswordToggle from './usePasswordToggle.hook';

export const PASSWORD_ERROR_CAPTION = 'PASSWORD_ERROR_CAPTION';

type FormFieldRef = HTMLInputElement | HTMLTextAreaElement;
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
  secret?: boolean;
  cleanable?: boolean;
  extraButton?: ReactNode;
  extraInner?: ReactNode;
  useDefaultInnerWrapper?: boolean;
  onClean?: () => void;
  fieldWrapperBottomMargin?: boolean;
  labelPaddingClassName?: string;
  dropdownInner?: ReactNode;
  copyable?: boolean;
}

export const FormField = forwardRef<FormFieldRef, FormFieldProps>(
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
      cleanable,
      extraButton = null,
      extraInner = null,
      dropdownInner = null,
      useDefaultInnerWrapper = true,
      id,
      type,
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      onClean,
      className,
      spellCheck = false,
      autoComplete = 'off',
      fieldWrapperBottomMargin = true,
      labelPaddingClassName = 'mb-4',
      copyable,
      testID,
      ...rest
    },
    ref
  ) => {
    const secret = secretProp && textarea;
    const Field = textarea ? 'textarea' : 'input';

    const [passwordInputType, TogglePasswordIcon] = usePasswordToggle();
    const isPasswordInput = type === 'password';
    const inputType = isPasswordInput ? passwordInputType : type;

    const { copy } = useCopyToClipboard();

    const [localValue, setLocalValue] = useState(value ?? defaultValue ?? '');
    const [focused, setFocused] = useState(false);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        inputChangeHandler(e, onChange, setLocalValue);
      },
      [onChange, setLocalValue]
    );

    const handleFocus = useCallback(
      (e: React.FocusEvent) => focusHandler(e, onFocus, setFocused),
      [onFocus, setFocused]
    );
    const handleBlur = useCallback((e: React.FocusEvent) => blurHandler(e, onBlur, setFocused), [onBlur, setFocused]);

    const secretBannerDisplayed = useMemo(
      () => Boolean(secret && localValue !== '' && !focused),
      [secret, localValue, focused]
    );

    const spareRef = useRef<FormFieldRef>();

    useBlurElementOnTimeout(spareRef, Boolean(secret && focused));

    const handleSecretBannerClick = () => void spareRef.current?.focus();
    const handleCleanClick = useCallback(() => void onClean?.(), [onClean]);

    return (
      <div className={classNames('w-full flex flex-col', containerClassName)} style={containerStyle}>
        <FieldLabel
          label={label}
          warning={labelWarning}
          description={labelDescription}
          className={labelPaddingClassName}
          id={id}
        />

        {extraSection}

        <div className={classNames('relative flex items-stretch', fieldWrapperBottomMargin && 'mb-2')}>
          <Field
            ref={combineRefs(ref, spareRef)}
            className={classNames(
              'appearance-none w-full py-3 pl-4 border-2 rounded-md bg-gray-100',
              'focus:border-primary-orange focus:bg-transparent focus:outline-none focus:shadow-outline',
              'transition ease-in-out duration-200',
              'text-gray-700 text-lg leading-tight placeholder-alphagray',
              getInnerClassName(isPasswordInput, extraInner),
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

          {localValue !== '' && isPasswordInput && TogglePasswordIcon}
          <ExtraInner innerComponent={extraInner} useDefaultInnerWrapper={useDefaultInnerWrapper} />

          {dropdownInner}

          {extraButton}

          {secretBannerDisplayed && (
            <SecretCover onClick={handleSecretBannerClick} testID={NewSeedBackupSelectors.protectedMask} />
          )}

          <Cleanable cleanable={cleanable} handleCleanClick={handleCleanClick} />
          <Copyable value={value} copy={copy} cleanable={cleanable} copyable={copyable} />
        </div>
        <ErrorCaption errorCaption={errorCaption} />
      </div>
    );
  }
);

interface ExtraInnerProps {
  innerComponent: React.ReactNode;
  useDefaultInnerWrapper: boolean;
}

const ExtraInner: React.FC<ExtraInnerProps> = ({ useDefaultInnerWrapper, innerComponent }) => {
  if (useDefaultInnerWrapper)
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

const getInnerClassName = (isPasswordInput: boolean, extraInner: ReactNode) => {
  const passwordClassName = isPasswordInput ? 'pr-12' : 'pr-4';
  return extraInner ? 'pr-32' : passwordClassName;
};

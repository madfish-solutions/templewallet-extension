import React, {
  forwardRef,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import classNames from 'clsx';

import CleanButton from 'app/atoms/CleanButton';
import CopyButton from 'app/atoms/CopyButton';
import { ReactComponent as CopyIcon } from 'app/icons/copy.svg';
import { ReactComponent as LockAltIcon } from 'app/icons/lock-alt.svg';
import { setTestID, TestIDProps } from 'lib/analytics';
import { T } from 'lib/i18n';
import { blurHandler, checkedHandler, focusHandler } from 'lib/ui/inputHandlers';
import useCopyToClipboard from 'lib/ui/useCopyToClipboard';

import usePasswordToggle from './usePasswordToggle.hook';

export const PASSWORD_ERROR_CAPTION = 'PASSWORD_ERROR_CAPTION';

type FormFieldRef = HTMLInputElement | HTMLTextAreaElement;
type FormFieldAttrs = InputHTMLAttributes<HTMLInputElement> & TextareaHTMLAttributes<HTMLTextAreaElement>;
interface FormFieldProps extends TestIDProps, FormFieldAttrs {
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
      (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
        checkedHandler(e, onChange!, setLocalValue);
      },
      [onChange, setLocalValue]
    );

    const handleFocus = useCallback(
      (e: React.FocusEvent<HTMLInputElement> | React.FocusEvent<HTMLTextAreaElement>) =>
        focusHandler(e, onFocus!, setFocused),
      [onFocus, setFocused]
    );
    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement> | React.FocusEvent<HTMLTextAreaElement>) =>
        blurHandler(e, onBlur!, setFocused),
      [onBlur, setFocused]
    );

    const getFieldEl = useCallback(() => {
      const selector = 'input, textarea';
      return rootRef.current?.querySelector<HTMLFormElement>(selector);
    }, []);

    useEffect(() => {
      if (secret && focused) {
        const handleLocalBlur = () => {
          getFieldEl()?.blur();
        };
        const t = setTimeout(() => {
          handleLocalBlur();
        }, 30_000);
        window.addEventListener('blur', handleLocalBlur);
        return () => {
          clearTimeout(t);
          window.removeEventListener('blur', handleLocalBlur);
        };
      }
      return undefined;
    }, [secret, focused, getFieldEl]);

    const secretBannerDisplayed = useMemo(
      () => Boolean(secret && localValue !== '' && !focused),
      [secret, localValue, focused]
    );

    const rootRef = useRef<HTMLDivElement>(null);

    const handleSecretBannerClick = useCallback(() => {
      getFieldEl()?.focus();
    }, [getFieldEl]);

    const handleCleanClick = useCallback(() => {
      if (onClean) {
        onClean();
      }
    }, [onClean]);

    return (
      <div ref={rootRef} className={classNames('w-full flex flex-col', containerClassName)} style={containerStyle}>
        <LabelComponent
          label={label}
          warning={labelWarning}
          description={labelDescription}
          className={labelPaddingClassName}
          id={id}
        />

        {extraSection}

        <div className={classNames('relative', fieldWrapperBottomMargin && 'mb-2', 'flex items-stretch')}>
          <Field
            ref={ref as any}
            className={classNames(
              'appearance-none',
              'w-full',
              'py-3 pl-4',
              getInnerClassName(isPasswordInput, extraInner),
              'border-2',
              errorCaption ? 'border-red-500' : 'border-gray-300',
              'focus:border-primary-orange',
              'bg-gray-100 focus:bg-transparent',
              'focus:outline-none focus:shadow-outline',
              'transition ease-in-out duration-200',
              'rounded-md',
              'text-gray-700 text-lg leading-tight',
              'placeholder-alphagray',
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

          <SecretBanner
            handleSecretBannerClick={handleSecretBannerClick}
            secretBannerDisplayed={secretBannerDisplayed}
          />

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
          'overflow-hidden',
          'absolute inset-y-0 right-0 w-32',
          'flex items-center justify-end',
          'opacity-50',
          'pointer-events-none'
        )}
      >
        <span className="mx-4 text-lg font-light text-gray-900">{innerComponent}</span>
      </div>
    );
  return <>{innerComponent}</>;
};

interface SecretBannerProps {
  handleSecretBannerClick: () => void;
  secretBannerDisplayed: boolean;
}

const SecretBanner: React.FC<SecretBannerProps> = ({ secretBannerDisplayed, handleSecretBannerClick }) =>
  secretBannerDisplayed ? (
    <div
      className={classNames(
        'absolute',
        'bg-gray-200',
        'rounded-md',
        'flex flex-col items-center justify-center',
        'cursor-text'
      )}
      style={{
        top: 2,
        right: 2,
        bottom: 2,
        left: 2
      }}
      onClick={handleSecretBannerClick}
    >
      <p
        className={classNames(
          'mb-1',
          'flex items-center',
          'text-gray-600 text-lg font-semibold',
          'uppercase',
          'text-shadow-black'
        )}
      >
        <LockAltIcon className={classNames('-ml-2 mr-1', 'h-6 w-auto', 'stroke-current stroke-2')} />
        <span>
          <T id="protectedFormField" />
        </span>
      </p>

      <p className={classNames('mb-1', 'flex items-center', 'text-gray-500 text-sm')}>
        <span>
          <T id="clickToRevealField" />
        </span>
      </p>
    </div>
  ) : null;

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
        className={classNames('h-4 ml-1 w-auto inline', 'stroke-orange stroke-2')}
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
    <div className="text-xs text-red-500">{errorCaption}</div>
  ) : null;
};

interface LabelComponentProps {
  className: string;
  label: ReactNode;
  description: ReactNode;
  warning: ReactNode;
  id?: string;
}

const LabelComponent: React.FC<LabelComponentProps> = ({ label, className, description, warning, id }) =>
  label ? (
    <label className={classNames(className, 'leading-tight', 'flex flex-col')} htmlFor={id}>
      <span className="text-base font-semibold text-gray-700">{label}</span>

      {description && (
        <span className={classNames('mt-1', 'text-xs font-light text-gray-600')} style={{ maxWidth: '90%' }}>
          {description}
        </span>
      )}

      {warning && (
        <span className={classNames('mt-1', 'text-xs font-medium text-red-600')} style={{ maxWidth: '90%' }}>
          {warning}
        </span>
      )}
    </label>
  ) : null;

const getInnerClassName = (isPasswordInput: boolean, extraInner: ReactNode) => {
  const passwordClassName = isPasswordInput ? 'pr-12' : 'pr-4';
  return extraInner ? 'pr-32' : passwordClassName;
};

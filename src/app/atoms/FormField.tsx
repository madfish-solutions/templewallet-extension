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
import { T } from 'lib/i18n/react';
import useCopyToClipboard from 'lib/ui/useCopyToClipboard';
import { blurHandler, checkedHandler, focusHandler } from 'lib/ui/inputHandlers';

type FormFieldRef = HTMLInputElement | HTMLTextAreaElement;
type FormFieldAttrs = InputHTMLAttributes<HTMLInputElement> & TextareaHTMLAttributes<HTMLTextAreaElement>;
interface FormFieldProps extends FormFieldAttrs {
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

const FormField = forwardRef<FormFieldRef, FormFieldProps>(
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
      ...rest
    },
    ref
  ) => {
    const secret = secretProp && textarea;
    const Field = textarea ? 'textarea' : 'input';

    const { copy } = useCopyToClipboard();

    const [localValue, setLocalValue] = useState(value ?? defaultValue ?? '');
    const [focused, setFocused] = useState(false);

    const handleChange = useCallback(checkedHandler, [onChange, setLocalValue]);

    const handleFocus = useCallback(focusHandler, [onFocus, setFocused]);
    const handleBlur = useCallback(blurHandler, [onBlur, setFocused]);

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
      () => Boolean(secret && localValue && !focused),
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
        {label ? (
          <label className={classNames(labelPaddingClassName, 'leading-tight', 'flex flex-col')} htmlFor={id}>
            <span className="text-base font-semibold text-gray-700">{label}</span>

            {labelDescription && (
              <span className={classNames('mt-1', 'text-xs font-light text-gray-600')} style={{ maxWidth: '90%' }}>
                {labelDescription}
              </span>
            )}

            {labelWarning && (
              <span className={classNames('mt-1', 'text-xs font-medium text-red-600')} style={{ maxWidth: '90%' }}>
                {labelWarning}
              </span>
            )}
          </label>
        ) : null}

        {extraSection}

        <div className={classNames('relative', fieldWrapperBottomMargin && 'mb-2', 'flex items-stretch')}>
          <Field
            ref={ref as any}
            className={classNames(
              'appearance-none',
              'w-full',
              'py-3 pl-4',
              extraInner ? 'pr-32' : 'pr-4',
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
            value={value}
            defaultValue={defaultValue}
            spellCheck={spellCheck}
            autoComplete={autoComplete}
            onChange={(e: any) => handleChange(e, onChange!, setLocalValue)}
            onFocus={(e: any) => handleFocus(e, onFocus!, setFocused)}
            onBlur={(e: any) => handleBlur(e, onBlur!, setFocused)}
            {...rest}
          />

          <ExtraInner extraInner={extraInner} useDefaultInnerWrapper={useDefaultInnerWrapper} />

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
  extraInner: {} | null;
  useDefaultInnerWrapper: boolean;
}

const ExtraInner: React.FC<ExtraInnerProps> = ({ useDefaultInnerWrapper, extraInner }) => {
  if (extraInner) {
    useDefaultInnerWrapper ? (
      <div
        className={classNames(
          'overflow-hidden',
          'absolute inset-y-0 right-0 w-32',
          'flex items-center justify-end',
          'opacity-50',
          'pointer-events-none'
        )}
      >
        <span className="mx-4 text-lg font-light text-gray-900">{extraInner}</span>
      </div>
    ) : (
      extraInner
    );
  }
  return null;
};

interface SecretBannerProps {
  handleSecretBannerClick: () => void;
  secretBannerDisplayed: React.ReactNode;
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
        <T id="protectedFormField">{message => <span>{message}</span>}</T>
      </p>

      <p className={classNames('mb-1', 'flex items-center', 'text-gray-500 text-sm')}>
        <T id="clickToRevealOrEditField">{message => <span>{message}</span>}</T>
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

const ErrorCaption: React.FC<ErrorCaptionProps> = ({ errorCaption }) =>
  errorCaption ? <div className="text-xs text-red-500">{errorCaption}</div> : null;

export default FormField;

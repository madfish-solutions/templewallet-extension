import React, { FC, useEffect } from 'react';

import classNames from 'clsx';

import DropdownWrapper from 'app/atoms/DropdownWrapper';
import Spinner from 'app/atoms/Spinner/Spinner';
import { useAppEnvStyle } from 'app/hooks/use-app-env-style.hook';
import { AnalyticsEventCategory, TestIDProperty, useAnalytics } from 'lib/analytics';
import { PaymentProviderInterface } from 'lib/buy-with-credit-card/topup.interface';
import { T } from 'lib/i18n';

import { PaymentProviderOption } from './PaymentProviderOption';
import styles from './style.module.css';

interface Props extends TestIDProperty {
  value?: PaymentProviderInterface;
  options: PaymentProviderInterface[];
  isLoading?: boolean;
  opened: boolean;
  setOpened: (newValue: boolean) => void;
  onChange?: (newValue: PaymentProviderInterface) => void;
}

export const PaymentProvidersMenu: FC<Props> = ({
  value,
  options,
  isLoading = false,
  opened,
  testID,
  setOpened,
  onChange
}) => {
  const { dropdownWidth } = useAppEnvStyle();

  const { trackEvent } = useAnalytics();

  useEffect(() => {
    if (testID && opened) trackEvent(testID, AnalyticsEventCategory.DropdownOpened);
  }, [opened, trackEvent]);

  const handleOptionClick = onChange
    ? (newValue: PaymentProviderInterface) => {
        if (value?.id !== newValue.id) {
          onChange(newValue);
        }
        setOpened(false);
      }
    : undefined;

  return (
    <DropdownWrapper
      opened={opened}
      className={classNames('origin-top overflow-x-hidden overflow-y-auto p-0', styles.root)}
      style={{ backgroundColor: 'white', borderColor: '#e2e8f0' }}
    >
      {(options.length === 0 || isLoading) && (
        <div className="my-8 flex flex-col items-center justify-center text-gray-500">
          {isLoading ? (
            <Spinner theme="primary" className={styles.spinner} />
          ) : (
            <p className="flex items-center justify-center text-gray-600 text-base font-light">
              <T id="noTopUpOptionsAvailable" />
            </p>
          )}
        </div>
      )}
      <div style={{ width: dropdownWidth, overflowY: 'scroll' }}>
        {options.map((option, index) => (
          <PaymentProviderOption
            key={option.id}
            value={option}
            isSelected={value?.id === option.id}
            shouldShowSeparator={index !== options.length - 1}
            onClick={handleOptionClick}
          />
        ))}
      </div>
    </DropdownWrapper>
  );
};

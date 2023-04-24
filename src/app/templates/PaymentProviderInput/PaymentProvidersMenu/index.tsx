import React, { FC, useEffect } from 'react';

import { List } from 'react-virtualized';

import DropdownWrapper from 'app/atoms/DropdownWrapper';
import Spinner from 'app/atoms/Spinner/Spinner';
import { useAppEnvStyle } from 'app/hooks/use-app-env-style.hook';
import { AnalyticsEventCategory, TestIDProperty, useAnalytics } from 'lib/analytics';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import { PaymentProviderInterface } from 'lib/buy-with-credit-card/topup.interface';
import { T } from 'lib/i18n';

import { PaymentProviderOption } from './PaymentProviderOption';

interface Props extends TestIDProperty {
  value?: TopUpProviderId;
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
        if (value !== newValue.id) {
          onChange(newValue);
        }
        setOpened(false);
      }
    : undefined;

  return (
    <DropdownWrapper
      opened={opened}
      className="origin-top overflow-x-hidden overflow-y-auto p-2"
      style={{
        marginTop: '0.25rem',
        maxHeight: '15.75rem',
        backgroundColor: 'white',
        borderColor: '#e2e8f0',
        padding: 0
      }}
    >
      {(options.length === 0 || isLoading) && (
        <div className="my-8 flex flex-col items-center justify-center text-gray-500">
          {isLoading ? (
            <Spinner theme="primary" style={{ width: '3rem' }} />
          ) : (
            <p className="flex items-center justify-center text-gray-600 text-base font-light">
              <T id="noTopUpOptionsAvailable" />
            </p>
          )}
        </div>
      )}
      <div style={{ width: dropdownWidth, height: options.length > 2 ? 240 : 132, overflowY: 'scroll' }}>
        {options.map((option, index) => (
          <PaymentProviderOption
            key={option.id}
            value={option}
            isSelected={value === option.id}
            shouldShowSeparator={index !== options.length - 1}
            onClick={handleOptionClick}
          />
        ))}
      </div>
    </DropdownWrapper>
  );
};

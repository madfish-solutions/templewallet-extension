import { TestIDProps } from 'lib/analytics';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import { PaymentProviderInterface } from 'lib/buy-with-credit-card/topup.interface';

export interface PaymentProviderInputProps extends TestIDProps {
  className?: string;
  error?: string;
  value?: TopUpProviderId;
  options: PaymentProviderInterface[];
  isLoading: boolean;
  onChange: (newValue: PaymentProviderInterface) => void;
}

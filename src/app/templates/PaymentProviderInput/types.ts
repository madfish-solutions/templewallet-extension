import { TestIDProps } from 'lib/analytics';
import { PaymentProviderInterface } from 'lib/buy-with-credit-card/topup.interface';

export interface PaymentProviderInputProps extends TestIDProps {
  className?: string;
  error?: string;
  value?: PaymentProviderInterface;
  options: PaymentProviderInterface[];
  isLoading: boolean;
  onChange: (newValue: PaymentProviderInterface) => void;
  headerTestID?: string;
}

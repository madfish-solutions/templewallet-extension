import {
  PaymentProviderInterface,
  TopUpInputInterface,
  TopUpOutputInterface
} from 'lib/buy-with-credit-card/topup.interface';

export interface BuyWithCreditCardFormValues {
  inputCurrency: TopUpInputInterface;
  inputAmount?: number;
  outputToken: TopUpOutputInterface;
  outputAmount?: number;
  topUpProvider?: PaymentProviderInterface;
}

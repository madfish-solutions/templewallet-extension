import { AliceBobOrderInfo } from 'lib/apis/temple';

export interface StepProps {
  orderInfo: AliceBobOrderInfo;
  isApiError: boolean;
  setStep: (step: number) => void;
  setOrderInfo: (orderInfo: AliceBobOrderInfo | null) => void;
  setIsApiError: (error: boolean) => void;
}

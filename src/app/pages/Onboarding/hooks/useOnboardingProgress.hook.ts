import { useStorage } from 'lib/temple/front';
import { useLocalStorage } from 'lib/ui/local-storage';

export const useOnboardingProgress = () => {
  // TODO: Enable onboarding by default
  const [onBoarding, setOnboarding] = useLocalStorage('onboarding', true);
  const [onboardingCompleted, setIsOnboardingCompleted] = useStorage('onboarding_completed', onBoarding);

  const setOnboardingCompleted = (value: boolean) => {
    setOnboarding(value);
    setIsOnboardingCompleted(value);
  };

  return {
    onboardingCompleted,
    setOnboardingCompleted
  };
};

import { useLocalStorage, useStorage } from '../../../../lib/temple/front';

export const useOnboardingProgress = () => {
  const [onBoarding, setOnboarding] = useLocalStorage('onboarding', false);
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

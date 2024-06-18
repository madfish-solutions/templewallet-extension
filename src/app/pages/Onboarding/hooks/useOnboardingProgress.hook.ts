import { useCallback } from 'react';

import { useStorage } from 'lib/temple/front';
import { useLocalStorage } from 'lib/ui/local-storage';

export const useOnboardingProgress = () => {
  const [onBoarding, setOnboarding] = useLocalStorage('onboarding', false);
  const [onboardingCompleted, setIsOnboardingCompleted] = useStorage('onboarding_completed', onBoarding);

  const setOnboardingCompleted = useCallback(
    async (value: boolean) => {
      setOnboarding(value);
      await setIsOnboardingCompleted(value);
    },
    [setIsOnboardingCompleted, setOnboarding]
  );

  return {
    onboardingCompleted,
    setOnboardingCompleted
  };
};

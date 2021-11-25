import { useStorage } from '../../../../lib/temple/front';

export const useOnboardingProgress = () => {
  const [onboardingCompleted, setOnboardingCompleted] = useStorage('onboarding_completed', false);

  return {
    onboardingCompleted,
    setOnboardingCompleted
  };
};

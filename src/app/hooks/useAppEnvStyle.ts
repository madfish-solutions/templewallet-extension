import { useAppEnv } from '../env';

export const useAppEnvStyle = () => {
  const { popup } = useAppEnv();

  return { dropdownWidth: popup ? 328 : 382 };
};

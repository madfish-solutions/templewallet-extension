import { useTypedSWR } from 'lib/swr';

const importPartnersPromotionModule = async () => {
  try {
    // An error appears below if and only the imported file is removed
    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
    // @ts-ignore
    // eslint-disable-next-line import/no-unresolved
    return await import('app/templates/partners-promotion/partners-promotion');
  } catch {
    return null;
  }
};

export const usePartnersPromotionModule = () => {
  const { data } = useTypedSWR('app/templates/partners-promotion/partners-promotion', importPartnersPromotionModule, {
    suspense: true,
    revalidateOnFocus: false,
    revalidateOnMount: true,
    revalidateOnReconnect: false
  });

  return data;
};

import { useTypedSWR } from 'lib/swr';

const importEnableAdsBannerModule = async () => {
  try {
    // An error appears below if and only the imported file is removed
    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
    // @ts-ignore
    // eslint-disable-next-line import/no-unresolved
    return await import(
      'app/pages/Home/OtherComponents/Tokens/components/NotificationBanner/enable-ads-banner/component'
    );
  } catch {
    return null;
  }
};

export const useEnableAdsBannerModule = () => {
  const { data } = useTypedSWR(
    'app/pages/Home/OtherComponents/Tokens/components/NotificationBanner/enable-ads-banner/component',
    importEnableAdsBannerModule,
    { suspense: true, revalidateOnFocus: false, revalidateOnMount: true, revalidateOnReconnect: false }
  );

  return data;
};

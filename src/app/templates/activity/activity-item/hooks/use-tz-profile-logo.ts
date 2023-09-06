import { useEffect, useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { fetchTzProfileInfo$ } from 'lib/apis/objkt';

export const useTzProfileLogo = (address?: string) => {
  const [logo, setLogo] = useState<string>();

  useEffect(() => {
    if (isDefined(address) && address.startsWith('tz')) {
      const subscription = fetchTzProfileInfo$(address).subscribe(tzProfile => setLogo(tzProfile.logo));

      return () => subscription.unsubscribe();
    }

    return undefined;
  }, [address]);

  // Handling urls that lead to objkt backend to which we do not have access
  // Example: https://backend-tmp-sgp1.sgp1.digitaloceanspaces.com/ec599057-69ee-47b6-98e0-4dbff88dfba8/logo
  if (logo?.endsWith('/logo')) {
    return undefined;
  }

  return logo;
};

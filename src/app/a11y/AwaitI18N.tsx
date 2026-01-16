import { FC } from 'react';

import { onInited } from 'lib/i18n';
import { useTypedSWR } from 'lib/swr';
import { delay } from 'lib/utils';

const AwaitI18N: FC = () => {
  useTypedSWR('i18n', awaitI18n, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  return null;
};

export default AwaitI18N;

async function awaitI18n() {
  try {
    await Promise.race([new Promise(r => onInited(() => r(null))), delay(3_000)]);
  } catch (err: any) {
    console.error(err);
  }
  return null;
}

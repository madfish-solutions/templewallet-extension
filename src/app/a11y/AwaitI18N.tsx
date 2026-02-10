import { FC, use } from 'react';

import { onInited } from 'lib/i18n';
import { delay } from 'lib/utils';

const AwaitI18N: FC = () => {
  use(i18nReadyPromise);

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

const i18nReadyPromise = awaitI18n();

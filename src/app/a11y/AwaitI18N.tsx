import { FC } from "react";

import useSWR from "swr";

import { IS_DEV_ENV } from "app/defaults";
import { onInited } from "lib/i18n";

const AwaitI18N: FC = () => {
  useSWR("i18n", awaitI18n, {
    suspense: true,
    shouldRetryOnError: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return null;
};

export default AwaitI18N;

async function awaitI18n() {
  try {
    await Promise.race([
      new Promise((r) => onInited(() => r(null))),
      new Promise((r) => setTimeout(r, 3_000)),
    ]);
  } catch (err: any) {
    if (IS_DEV_ENV) {
      console.error(err);
    }
  }
  return null;
}

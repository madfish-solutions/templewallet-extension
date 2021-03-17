import { FC } from "react";

import useSWR from "swr";

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
  } finally {
    return null;
  }
}

import { TezosToolkit } from "@taquito/taquito";

export function applyTezosCounters(tezos: TezosToolkit) {
  const tezosContext = (tezos as any)._context;
  tezosContext._counters = new Proxy(
    {},
    {
      get: (_target, prop) => {
        return typeof prop === "string" ? getCounter(prop) : undefined;
      },
      set: (_target, prop, value) => {
        if (typeof prop === "string") setCounter(prop, value);
        return true;
      },
    }
  );
}

export function resetCounter(pkh: string) {
  localStorage.removeItem(toCounterKey(pkh));
  localStorage.removeItem(toReleasedCounterKey(pkh));
}

// Plain counter

export function getCounter(pkh: string) {
  return getCounterValue(toCounterKey(pkh));
}

export function setCounter(pkh: string, value: number | undefined) {
  setCounterValue(toCounterKey(pkh), value);
}

export function toCounterKey(pkh: string) {
  return `counter_${pkh}`;
}

// Released counter

export function getReleasedCounter(pkh: string) {
  return getCounterValue(toReleasedCounterKey(pkh));
}

export function setReleasedCounter(pkh: string, value: number | undefined) {
  setCounterValue(toReleasedCounterKey(pkh), value);
}

export function toReleasedCounterKey(pkh: string) {
  return `counter_released_${pkh}`;
}

// Misc

function getCounterValue(key: string) {
  try {
    const value = localStorage.getItem(key);
    if (value) {
      return JSON.parse(value) as number;
    }
  } catch {}

  return undefined;
}

function setCounterValue(key: string, value: number | undefined) {
  if (value) {
    localStorage.setItem(key, JSON.stringify(value));
  } else {
    localStorage.removeItem(key);
  }
}

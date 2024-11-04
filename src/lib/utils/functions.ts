export function throttleAsyncCalls<F extends (...args: any[]) => any>(
  func: F
): (...args: Parameters<F>) => Promise<void> {
  let settling = false;

  return async function (...args: Parameters<F>) {
    if (settling) return;
    settling = true;

    try {
      await func(...args);
      return;
    } finally {
      settling = false;
    }
  };
}

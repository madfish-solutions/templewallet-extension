import { useCallback, useEffect, useRef, useState } from 'react';

export function useClipboardWrite(resetDelay: number = 1000 * 2) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;

    const timeout = window.setTimeout(() => void setCopied(false), resetDelay);

    return () => void window.clearTimeout(timeout);
  }, [copied]);

  const copy = useCallback(
    (value: string) => {
      if (copied) return;

      navigator.clipboard.writeText(value);
      setCopied(true);
    },
    [copied, setCopied]
  );

  return { copied, copy };
}

export default function useCopyToClipboard<T extends HTMLInputElement | HTMLTextAreaElement = HTMLInputElement>(
  copyDelay: number = 1000 * 2
) {
  const fieldRef = useRef<T>(null);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;

    const timeout = window.setTimeout(() => {
      setCopied(false);
      const textarea = fieldRef.current;
      if (textarea && document.activeElement === textarea) {
        textarea.blur();
      }
    }, copyDelay);

    return () => void window.clearTimeout(timeout);
  }, [copied, setCopied, copyDelay]);

  const copy = useCallback(() => {
    if (copied) return;

    const textarea = fieldRef.current;
    if (!textarea) return;

    textarea.focus();
    textarea.select();
    navigator.clipboard.writeText(textarea.value);
    setCopied(true);
  }, [copied, setCopied]);

  return { fieldRef, copied, setCopied, copy };
}

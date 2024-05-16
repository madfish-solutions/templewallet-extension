import { useCallback, useEffect, useRef, useState } from 'react';

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

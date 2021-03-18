import { useCallback, useEffect, useRef, useState } from "react";

export default function useCopyToClipboard<
  T extends HTMLInputElement | HTMLTextAreaElement = HTMLInputElement
>(copyDelay: number = 1000 * 2) {
  const fieldRef = useRef<T>(null);

  const [copied, setCopied] = useState(false);

  const copiedTimeoutRef = useRef<number>();
  useEffect(() => {
    if (copied) {
      copiedTimeoutRef.current = window.setTimeout(() => {
        setCopied(false);
        const textarea = fieldRef.current;
        if (textarea && document.activeElement === textarea) {
          textarea.blur();
        }
      }, copyDelay);
    }

    return () => {
      clearTimeout(copiedTimeoutRef.current);
    };
  }, [copied, setCopied, copyDelay]);

  const copy = useCallback(() => {
    if (copied) return;

    const textarea = fieldRef.current;
    if (textarea) {
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      setCopied(true);
    }
  }, [copied, setCopied]);

  return { fieldRef, copied, setCopied, copy };
}

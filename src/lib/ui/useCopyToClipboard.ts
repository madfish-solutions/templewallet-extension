import * as React from "react";

export default function useCopyToClipboard<
  T extends HTMLInputElement | HTMLTextAreaElement = HTMLInputElement
>(copyDelay: number = 1000 * 2) {
  const fieldRef = React.useRef<T>(null);

  const [copied, setCopied] = React.useState(false);

  const copiedTimeoutRef = React.useRef<number>();
  React.useEffect(() => {
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

  const copy = React.useCallback(() => {
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

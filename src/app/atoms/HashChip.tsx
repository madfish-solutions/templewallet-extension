import * as React from "react";
import useCopyToClipboard from "lib/ui/useCopyToClipboard";
import useTippy from "lib/ui/useTippy";
import classNames from "clsx";

type HashChipProps = React.HTMLAttributes<HTMLButtonElement> & {
  hash: string;
  firstCharsCount?: number;
  lastCharsCount?: number;
  small?: boolean;
};

const HashChip: React.FC<HashChipProps> = ({
  hash,
  firstCharsCount = 7,
  lastCharsCount = 4,
  small = false,
  className,
  ...rest
}) => {
  const shortHash = React.useMemo(() => {
    const ln = hash.length;
    return (
      <>
        {hash.slice(0, firstCharsCount)}
        <span className="opacity-75">...</span>
        {hash.slice(ln - lastCharsCount, ln)}
      </>
    );
  }, [hash, firstCharsCount, lastCharsCount]);

  const { fieldRef, copy, copied, setCopied } = useCopyToClipboard();

  const tippyProps = React.useMemo(
    () => ({
      trigger: "mouseenter",
      hideOnClick: false,
      content: copied ? "Copied." : "Copy to clipboard",
      animation: "shift-away-subtle",
      onHidden() {
        setCopied(false);
      }
    }),
    [copied, setCopied]
  );

  const buttonRef = useTippy<HTMLButtonElement>(tippyProps);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={classNames(
          "bg-gray-100 hover:bg-gray-200",
          "rounded-sm shadow-xs",
          small ? "text-xs p-1" : "text-sm py-1 px-2",
          "text-gray-600 leading-none select-none",
          "transition ease-in-out duration-300",
          className
        )}
        {...rest}
        onClick={copy}
      >
        {shortHash}
      </button>

      <input ref={fieldRef} value={hash} readOnly className="sr-only" />
    </>
  );
};

export default HashChip;

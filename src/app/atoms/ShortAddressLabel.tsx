import * as React from "react";
import useCopyToClipboard from "lib/ui/useCopyToClipboard";
import useTippy from "lib/ui/useTippy";
import classNames from "clsx";

type ShortAddressLabelProps = React.HTMLAttributes<HTMLButtonElement> & {
  address: string;
};

const ShortAddressLabel: React.FC<ShortAddressLabelProps> = ({
  address,
  className,
  ...rest
}) => {
  const shortAddress = React.useMemo(() => {
    const ln = address.length;
    return (
      <>
        {address.slice(0, 7)}
        <span className="opacity-75">...</span>
        {address.slice(ln - 4, ln)}
      </>
    );
  }, [address]);

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
          "py-1 px-2",
          "text-gray-600 text-sm leading-none select-none",
          "transition ease-in-out duration-300",
          className
        )}
        {...rest}
        onClick={copy}
      >
        {shortAddress}
      </button>

      <input ref={fieldRef} value={address} readOnly className="sr-only" />
    </>
  );
};

export default ShortAddressLabel;

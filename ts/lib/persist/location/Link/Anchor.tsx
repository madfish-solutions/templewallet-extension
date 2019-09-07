import * as React from "react";

interface LinkAnchorProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  navigate: () => void;
  onClick?: React.MouseEventHandler;
  target?: string;
}

const LinkAnchor: React.FC<LinkAnchorProps> = ({
  children,
  navigate,
  onClick,
  target,
  ...rest
}) => {
  const handleClick = React.useCallback(
    evt => {
      try {
        if (onClick) {
          onClick(evt);
        }
      } catch (err) {
        evt.preventDefault();
        throw err;
      }

      if (
        !evt.defaultPrevented && // onClick prevented default
        evt.button === 0 && // ignore everything but left clicks
        (!target || target === "_self") && // let browser handle "target=_blank" etc.
        !isModifiedEvent(evt) // ignore clicks with modifier keys
      ) {
        evt.preventDefault();
        navigate();
      }
    },
    [onClick, target, navigate]
  );

  return (
    <a onClick={handleClick} target={target} {...rest}>
      {children}
    </a>
  );
};

export default LinkAnchor;

function isModifiedEvent(event: MouseEvent) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}

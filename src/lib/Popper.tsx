import * as React from "react";
import classNames from "clsx";
import { Instance, Options, createPopper } from "@popperjs/core";
import useOnClickOutside from "use-onclickoutside";

export interface PopperRenderProps {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
}
export type PopperRenderPropsValue<T> = T | ((props: PopperRenderProps) => T);

type PopperProps = React.HTMLAttributes<HTMLDivElement> & {
  popper?: Partial<Options>;
  containerClassName?: string;
  trigger: PopperRenderPropsValue<React.ReactElement>;
  children: PopperRenderPropsValue<React.ReactElement>;
};

const Popper: React.FC<PopperProps> = ({
  popper: popperOptions,
  containerClassName,
  trigger,
  children,
  ...rest
}) => {
  const rootRef = React.useRef(null);
  const popperRef = React.useRef<Instance>();
  const triggerRef = React.useRef<HTMLElement>(null);
  const popupRef = React.useRef<HTMLDivElement>(null);

  const [opened, setOpened] = React.useState(false);

  const togglePopup = React.useCallback(() => {
    setOpened(o => !o);
  }, [setOpened]);

  const handleClickOuside = React.useCallback(() => {
    setOpened(false);
  }, [setOpened]);

  useOnClickOutside(rootRef, handleClickOuside);

  React.useEffect(() => {
    if (triggerRef.current && popupRef.current) {
      const popper = (popperRef.current = createPopper(
        triggerRef.current,
        popupRef.current,
        popperOptions
      ));

      return () => {
        popper.destroy();
      };
    }
  }, [popperOptions]);

  React.useLayoutEffect(() => {
    popperRef.current?.forceUpdate();
  }, [opened]);

  const renderProps = React.useMemo(
    () => ({
      opened,
      setOpened
    }),
    [opened, setOpened]
  );

  const triggerNode = React.useMemo(
    () => (typeof trigger === "function" ? trigger(renderProps) : trigger),
    [trigger, renderProps]
  );

  const childrenNode = React.useMemo(
    () => (typeof children === "function" ? children(renderProps) : children),
    [children, renderProps]
  );

  return (
    <span ref={rootRef} {...rest}>
      {React.cloneElement(triggerNode, {
        ref: triggerRef,
        onClick: togglePopup
      })}

      <div ref={popupRef} className={classNames("z-50", containerClassName)}>
        {opened && childrenNode}
      </div>
    </span>
  );
};

export default Popper;

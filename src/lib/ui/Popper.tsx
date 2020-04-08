import * as React from "react";
import { Instance, Options, createPopper } from "@popperjs/core";
import useOnClickOutside from "use-onclickoutside";
import Portal from "lib/ui/Portal";

export interface PopperRenderProps {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
  toggleOpened: () => void;
}
export type RenderProp<P> = (props: P) => React.ReactElement;

type PopperProps = Partial<Options> & {
  popup: RenderProp<PopperRenderProps>;
  children: RenderProp<
    PopperRenderProps & {
      ref: React.RefObject<HTMLButtonElement>;
    }
  >;
};

const Popper = React.memo<PopperProps>(
  ({ popup, children, ...popperOptions }) => {
    const popperRef = React.useRef<Instance>();
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const popupRef = React.useRef<HTMLDivElement>(null);

    const [opened, setOpened] = React.useState(false);

    const toggleOpened = React.useCallback(() => {
      setOpened((o) => !o);
    }, [setOpened]);

    const handleClickOuside = React.useCallback(
      (evt) => {
        if (!(triggerRef.current && triggerRef.current.contains(evt.target))) {
          setOpened(false);
        }
      },
      [setOpened]
    );

    useOnClickOutside(popupRef, opened ? handleClickOuside : null);

    const finalOptions = React.useMemo(
      () => ({
        ...popperOptions,
        modifiers: [
          {
            name: "preventOverflow",
            options: {
              padding: 8,
            },
          },
          {
            name: "hide",
          },
          ...(popperOptions.modifiers ?? []),
        ],
      }),
      [popperOptions]
    );

    React.useEffect(() => {
      if (popperRef.current) {
        popperRef.current.setOptions(finalOptions);
      } else if (triggerRef.current && popupRef.current) {
        popperRef.current = createPopper(
          triggerRef.current,
          popupRef.current,
          finalOptions
        );
      }
    }, [finalOptions]);

    React.useEffect(
      () => () => {
        if (popperRef.current) {
          popperRef.current.destroy();
        }
      },
      []
    );

    React.useLayoutEffect(() => {
      popperRef.current?.forceUpdate();
    }, [opened]);

    const renderPropsBase = React.useMemo(
      () => ({
        opened,
        setOpened,
        toggleOpened,
      }),
      [opened, setOpened, toggleOpened]
    );

    const triggerNode = React.useMemo(
      () => children({ ...renderPropsBase, ref: triggerRef }),
      [children, renderPropsBase]
    );

    const popupNode = React.useMemo(() => popup(renderPropsBase), [
      popup,
      renderPropsBase,
    ]);

    return (
      <>
        {triggerNode}

        <Portal>
          <div ref={popupRef} className="z-40">
            {popupNode}
          </div>
        </Portal>
      </>
    );
  }
);

export default Popper;

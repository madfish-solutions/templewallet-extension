import React, {
  Dispatch,
  memo,
  ReactElement,
  RefObject, SetStateAction,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";

import { Instance, Options, createPopper } from "@popperjs/core";
import useOnClickOutside from "use-onclickoutside";

import Portal from "lib/ui/Portal";

export interface PopperRenderProps {
  opened: boolean;
  setOpened: Dispatch<SetStateAction<boolean>>;
  toggleOpened: () => void;
}
export type RenderProp<P> = (props: P) => ReactElement;

type PopperProps = Partial<Options> & {
  popup: RenderProp<PopperRenderProps>;
  children: RenderProp<
    PopperRenderProps & {
      ref: RefObject<HTMLButtonElement>;
    }
  >;
};

const Popper = memo<PopperProps>(
  ({ popup, children, ...popperOptions }) => {
    const popperRef = useRef<Instance>();
    const triggerRef = useRef<HTMLButtonElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    const [opened, setOpened] = useState(false);

    const toggleOpened = useCallback(() => {
      setOpened((o) => !o);
    }, [setOpened]);

    const handleClickOuside = useCallback(
      (evt) => {
        if (!(triggerRef.current && triggerRef.current.contains(evt.target))) {
          setOpened(false);
        }
      },
      [setOpened]
    );

    useOnClickOutside(popupRef, opened ? handleClickOuside : null);

    const finalOptions = useMemo(
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

    useEffect(() => {
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

    useEffect(
      () => () => {
        if (popperRef.current) {
          popperRef.current.destroy();
        }
      },
      []
    );

    useLayoutEffect(() => {
      popperRef.current?.forceUpdate();
    }, [opened]);

    const renderPropsBase = useMemo(
      () => ({
        opened,
        setOpened,
        toggleOpened,
      }),
      [opened, setOpened, toggleOpened]
    );

    const triggerNode = useMemo(
      () => children({ ...renderPropsBase, ref: triggerRef }),
      [children, renderPropsBase]
    );

    const popupNode = useMemo(() => popup(renderPropsBase), [
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

import React, {
  Dispatch,
  memo,
  ReactElement,
  RefObject,
  SetStateAction,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import { Instance, Options, createPopper } from '@popperjs/core';
import useOnClickOutside from 'use-onclickoutside';

import Portal from 'lib/ui/Portal';
import { isTruthy } from 'lib/utils';

export interface PopperRenderProps {
  opened: boolean;
  setOpened: Dispatch<SetStateAction<boolean>>;
  toggleOpened: () => void;
}
type RenderProp<P> = (props: P) => ReactElement;

type PopperProps = Partial<Options> & {
  popup: RenderProp<PopperRenderProps>;
  children: RenderProp<
    PopperRenderProps & {
      ref: RefObject<HTMLButtonElement>;
    }
  >;
  fallbackPlacementsEnabled?: boolean;
  style?: React.CSSProperties;
};

const Popper = memo<PopperProps>(({ popup, children, fallbackPlacementsEnabled = true, style, ...popperOptions }) => {
  const popperRef = useRef<Instance>();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const [opened, setOpened] = useState(false);

  const toggleOpened = useCallback(() => {
    setOpened(o => !o);
  }, [setOpened]);

  useOnClickOutside(
    popupRef,
    opened
      ? evt => {
          // @ts-ignore
          if (!(triggerRef.current && triggerRef.current.contains(evt.target))) {
            setOpened(false);
          }
        }
      : null
  );

  /* See: https://popper.js.org/docs/v2/lifecycle */
  const finalOptions = useMemo(
    () => ({
      ...popperOptions,
      /* See: https://popper.js.org/docs/v2/modifiers */
      modifiers: [
        {
          name: 'preventOverflow',
          options: {
            padding: 8
          }
        },
        !fallbackPlacementsEnabled && {
          name: 'flip',
          options: {
            fallbackPlacements: []
          }
        },
        {
          name: 'hide'
        },
        ...(popperOptions.modifiers ?? [])
      ].filter(isTruthy)
    }),
    [popperOptions, fallbackPlacementsEnabled]
  );

  useEffect(() => {
    if (popperRef.current) {
      popperRef.current.setOptions(finalOptions);
    } else if (triggerRef.current && popupRef.current) {
      popperRef.current = createPopper(triggerRef.current, popupRef.current, finalOptions);
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
      toggleOpened
    }),
    [opened, setOpened, toggleOpened]
  );

  const triggerNode = useMemo(() => children({ ...renderPropsBase, ref: triggerRef }), [children, renderPropsBase]);

  const popupNode = useMemo(() => popup(renderPropsBase), [popup, renderPropsBase]);

  return (
    <>
      {triggerNode}

      <Portal>
        <div ref={popupRef} className="z-40" style={style}>
          {popupNode}
        </div>
      </Portal>
    </>
  );
});

export default Popper;

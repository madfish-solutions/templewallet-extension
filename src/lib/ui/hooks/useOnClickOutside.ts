import { RefObject, useEffect, useLayoutEffect, useRef } from 'react';

const MOUSEDOWN = 'mousedown';
const TOUCHSTART = 'touchstart';

type HandledEvents = [typeof MOUSEDOWN, typeof TOUCHSTART];
type HandledEventsType = HandledEvents[number];
type PossibleEvent = {
  [Type in HandledEventsType]: HTMLElementEventMap[Type];
}[HandledEventsType];
type Handler = (event: PossibleEvent) => void;

const events: HandledEvents = [MOUSEDOWN, TOUCHSTART];

export default function useOnClickOutside(ref: RefObject<HTMLElement | null>, handler: Handler | null) {
  const handlerRef = useRef(handler);

  useLayoutEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!handler) {
      return;
    }

    const abortController = new AbortController();
    const { signal } = abortController;

    const listener = (event: PossibleEvent) => {
      if (!ref?.current || !handlerRef.current || ref?.current.contains(event.target as Node)) {
        return;
      }

      handlerRef.current(event);
    };

    events.forEach(event => {
      document.addEventListener(event, listener, event === TOUCHSTART ? { passive: true, signal } : { signal });
    });

    return () => {
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handler]);
}

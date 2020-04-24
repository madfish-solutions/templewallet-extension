import * as React from "react";

// left: 37, up: 38, right: 39, down: 40,
// spacebar: 32, pageup: 33, pagedown: 34, end: 35, home: 36
const KEYS = [33, 34, 38, 40];

// modern Chrome requires { passive: false } when adding event
let supportsPassive = false;
try {
  (window as any).addEventListener(
    "test",
    null,
    Object.defineProperty({}, "passive", {
      get: function () {
        supportsPassive = true;
        return null;
      },
    })
  );
} catch (_err) {}

const wheelOpt: any = supportsPassive ? { passive: false } : false;
const wheelEvent =
  "onwheel" in document.createElement("div") ? "wheel" : "mousewheel";

export default function useScrollLock(enabled: boolean) {
  const preventDefault = React.useCallback((evt: any) => {
    evt.preventDefault();
  }, []);

  const preventDefaultForScrollKeys = React.useCallback(
    (evt: any) => {
      if (KEYS.includes(evt.keyCode)) {
        preventDefault(evt);
        return false;
      }
    },
    [preventDefault]
  );

  React.useEffect(() => {
    if (enabled) {
      window.addEventListener("DOMMouseScroll", preventDefault, false); // older FF
      window.addEventListener(wheelEvent, preventDefault, wheelOpt); // modern desktop
      window.addEventListener("touchmove", preventDefault, wheelOpt); // mobile
      window.addEventListener("keydown", preventDefaultForScrollKeys, false);

      return () => {
        window.removeEventListener("DOMMouseScroll", preventDefault, false);
        window.removeEventListener(wheelEvent, preventDefault, wheelOpt);
        window.removeEventListener("touchmove", preventDefault, wheelOpt);
        window.removeEventListener(
          "keydown",
          preventDefaultForScrollKeys,
          false
        );
      };
    }
  }, [enabled, preventDefault, preventDefaultForScrollKeys]);
}

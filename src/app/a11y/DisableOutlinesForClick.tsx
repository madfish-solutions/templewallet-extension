import { FC, useEffect } from "react";

import styles from "./DisableOutlinesForClick.module.css";

const TAB_KEY_CODE = 9;
const CLASS_NAME = styles["focus-disabled"];

/**
 * A nifty little class that maintains event handlers to add a class
 * to the container element when entering "mouse mode" (on a `mousedown` event)
 * and remove it when entering "keyboard mode" (on a `tab` key `keydown` event)
 */
const DisableOutlinesForClick: FC = () => {
  useEffect(() => {
    const container = document.documentElement;
    container.addEventListener("mousedown", handleMouseDown);

    return reset;

    function handleMouseDown() {
      reset();
      container.classList.add(CLASS_NAME);
      container.addEventListener("keydown", handleKeyDown);
    }

    function handleKeyDown(evt: KeyboardEvent) {
      if (evt.which === TAB_KEY_CODE) {
        reset();
        container.addEventListener("mousedown", handleMouseDown);
      }
    }

    function reset() {
      container.classList.remove(CLASS_NAME);
      container.removeEventListener("keydown", handleKeyDown);
      container.removeEventListener("mousedown", handleMouseDown);
    }
  }, []);

  return null;
};

export default DisableOutlinesForClick;

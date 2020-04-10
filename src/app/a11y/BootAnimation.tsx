import * as React from "react";
import classNames from "clsx";
import CSSTransition from "react-transition-group/CSSTransition";

const BootAnimation: React.FC = ({ children }) => {
  const [booted, setBooted] = React.useState(false);

  React.useLayoutEffect(() => {
    setBooted(true);
  }, [setBooted]);

  return (
    <CSSTransition
      in={booted}
      timeout={200}
      classNames={{
        enter: "opacity-0",
        enterActive: classNames(
          "opacity-100",
          "transition ease-out duration-200"
        ),
        exit: classNames("opacity-0", "transition ease-in duration-200"),
      }}
      unmountOnExit
    >
      {children}
    </CSSTransition>
  );
};

export default BootAnimation;

import * as React from "react";
import useForceUpdate from "use-force-update";

type OverscrollBgProps = {
  topClassName: string;
  bottomClassName: string;
};

const doc = document.documentElement;

const OverscrollBg: React.FC<OverscrollBgProps> = ({
  topClassName,
  bottomClassName
}) => {
  const scrollTop = useScrollTop();

  React.useEffect(() => {
    const scrollRoad = doc.scrollHeight - doc.clientHeight;
    const newClassName =
      scrollTop > scrollRoad / 2 ? bottomClassName : topClassName;

    if (!doc.classList.contains(newClassName)) {
      doc.classList.remove(
        newClassName === bottomClassName ? topClassName : bottomClassName
      );
      doc.classList.add(newClassName);
    }
  }, [scrollTop, topClassName, bottomClassName]);

  React.useEffect(
    () => () => {
      doc.classList.remove(topClassName, bottomClassName);
    },
    [topClassName, bottomClassName]
  );

  return null;
};

export default OverscrollBg;

function useScrollTop() {
  const forceUpdate = useForceUpdate();

  React.useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };

    function handleScroll() {
      forceUpdate();
    }
  }, [forceUpdate]);

  return doc.scrollTop;
}

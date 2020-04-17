import * as React from "react";

type OverscrollBgProps = {
  topClassName: string;
  bottomClassName: string;
};

const doc = document.documentElement;

const OverscrollBg: React.FC<OverscrollBgProps> = ({
  topClassName,
  bottomClassName,
}) => {
  const prevScrollTopRef = React.useRef<number>();

  const handleScroll = React.useCallback(() => {
    const scrollTop = doc.scrollTop;
    if (scrollTop !== prevScrollTopRef.current) {
      const scrollRoad = doc.scrollHeight - doc.clientHeight;
      const newClassName =
        scrollTop > scrollRoad / 2 ? bottomClassName : topClassName;

      if (!doc.classList.contains(newClassName)) {
        doc.classList.remove(
          newClassName === bottomClassName ? topClassName : bottomClassName
        );
        doc.classList.add(newClassName);
      }
    }

    prevScrollTopRef.current = scrollTop;
  }, [topClassName, bottomClassName]);

  React.useLayoutEffect(() => {
    handleScroll();
    return () => {
      doc.classList.remove(topClassName, bottomClassName);
    };
  }, [handleScroll, topClassName, bottomClassName]);

  useScroll(handleScroll);

  return null;
};

export default OverscrollBg;

function useScroll(listener: () => void) {
  React.useEffect(() => {
    window.addEventListener("scroll", listener);
    return () => {
      window.removeEventListener("scroll", listener);
    };
  }, [listener]);
}

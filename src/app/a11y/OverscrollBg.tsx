import { FC, useCallback, useEffect, useLayoutEffect, useRef } from "react";

type OverscrollBgProps = {
  topClassName: string;
  bottomClassName: string;
};

const doc = document.documentElement;

const OverscrollBg: FC<OverscrollBgProps> = ({
  topClassName,
  bottomClassName,
}) => {
  const prevScrollTopRef = useRef<number>();

  const handleScroll = useCallback(() => {
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

  useLayoutEffect(() => {
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
  useEffect(() => {
    window.addEventListener("scroll", listener);
    return () => {
      window.removeEventListener("scroll", listener);
    };
  }, [listener]);
}

import { FC, useLayoutEffect } from "react";

type DocBgProps = {
  bgClassName: string;
};

const doc = document.documentElement;

const DocBg: FC<DocBgProps> = ({ bgClassName }) => {
  useLayoutEffect(() => {
    const toReturn: string[] = [];
    doc.classList.forEach((token) => {
      if (token.startsWith("bg-")) {
        toReturn.push(token);
      }
    });
    doc.classList.remove(...toReturn);

    doc.classList.add(bgClassName);
    return () => {
      doc.classList.remove(bgClassName);
      doc.classList.add(...toReturn);
    };
  }, [bgClassName]);

  return null;
};

export default DocBg;

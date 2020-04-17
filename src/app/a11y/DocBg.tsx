import * as React from "react";

type DocBgProps = {
  bgClassName: string;
};

const doc = document.documentElement;

const DocBg: React.FC<DocBgProps> = ({ bgClassName }) => {
  React.useLayoutEffect(() => {
    doc.classList.add(bgClassName);
    return () => {
      doc.classList.remove(bgClassName);
    };
  }, [bgClassName]);

  return null;
};

export default DocBg;

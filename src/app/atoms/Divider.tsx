import React, { FC } from "react";

interface DividerProps {
  style?: React.CSSProperties;
}

const Divider: FC<DividerProps> = ({ style }) => (
  <div
    style={{
      width: "100%",
      height: "1px",
      backgroundColor: "#E2E8F0",
      ...style,
    }}
  />
);

export default Divider;

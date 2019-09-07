import * as React from "react";
import WidthContainer from "app/layouts/WidthContainer";

const SuspenseFallback: React.FC = () => (
  <WidthContainer className="py-20 text-center">
    <h4 className="text-4xl">Loading...</h4>
  </WidthContainer>
);

export default SuspenseFallback;

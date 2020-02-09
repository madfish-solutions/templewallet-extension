import * as React from "react";
import { useThanosFrontContext } from "lib/thanos/front";

const Explore: React.FC = () => {
  const { account } = useThanosFrontContext();

  return (
    <div className="p-4">
      <h1 className="mb-2">Explore</h1>
      <p>{JSON.stringify(account)}</p>
    </div>
  );
};

export default Explore;

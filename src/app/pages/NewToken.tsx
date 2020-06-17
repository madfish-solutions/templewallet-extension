import * as React from "react";
import { useTokens } from "lib/thanos/front";

enum TokenType {
  FA1_2 = "FA1_2",
  FA2 = "FA2",
  NFT = "NFT",
}

interface Token {
  transferAllowed: boolean;
}

interface FormData {
  tokenType: TokenType;
  address: string;
}

const NewToken: React.FC = () => {
  const { addToken } = useTokens();

  return <div className={"asd"}></div>;
};

export default NewToken;

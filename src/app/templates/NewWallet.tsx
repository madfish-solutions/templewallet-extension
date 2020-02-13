import * as React from "react";
import { useForm } from "react-hook-form";

type NewWalletProps = {};

type FormData = {
  privateKey: string;
};

const NewWallet: React.FC<NewWalletProps> = () => {
  const { register, handleSubmit, errors, setError, clearError } = useForm<
    FormData
  >();

  return <div></div>;
};

export default NewWallet;

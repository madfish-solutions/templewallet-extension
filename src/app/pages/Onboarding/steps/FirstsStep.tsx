import React from "react";

import {T} from "../../../../lib/i18n/react";
import AddressBalanceImg from "../images/address-balance.svg"
import styles from "../Onboarding.module.css";


const FirstsStep = () => {
  return (
    <>
      <p className={styles["title"]}>
        <T id={"addressBalanceDetails"}/>
      </p>
      <p className={styles["description"]}>
        <T id={"addressBalanceDescription"}/>
      </p>
      <img src={AddressBalanceImg} alt='AddressBalanceImg'/>
      <p className={styles["description"]}>
        <T id={"addressBalanceHint"}/>
      </p>
    </>
  );
}

export default FirstsStep;
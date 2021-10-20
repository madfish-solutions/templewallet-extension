import React from "react";

import {T} from "../../../../lib/i18n/react";
import ExploreButtonsImg from "../images/explore-buttons.png"
import styles from "../Onboarding.module.css";


const SecondStep = () => {
  return (
    <>
      <p className={styles["title"]}>
        <T id={"howToStartDetails"}/>
      </p>
      <p className={styles["description"]} style={{marginBottom: 20}}>
        <T id={"howToStartDescription1"}/>
      </p>
      <p className={styles["description"]} style={{marginTop: 20}}>
        <T id={"howToStartDescription2"}/>
      </p>
      <img src={ExploreButtonsImg} alt='ExploreButtonsImg'/>
      <p className={styles["description"]}>
        <T id={"howToStartHint"}/>
      </p>
    </>
  );
}

export default SecondStep;
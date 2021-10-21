import React, {FC} from "react";

import {T} from "../../../../lib/i18n/react";
import {Button} from "../../../atoms/Button";
import styles from "../Onboarding.module.css";

interface Props {
  setStep: (step: number) => void;
}

const AttentionPage: FC<Props> = ({setStep}) => {
  return (
    <>
      <p className={styles["title"]}>
        <T id={"attention"}/>
      </p>
      <p className={styles["description"]}>
        <T id={"attentionDescription"}/>
      </p>
      <p className={styles["description"]} style={{textAlign: "start", marginBottom: 20, marginLeft: -24}}>
        <T id={"attentionListTitle1"}/>
      </p>
      <ul className={styles["listContainer"]}>
        <li><T id={"attentionListItem1"}/></li>
        <li><T id={"attentionListItem2"}/></li>
        <li><T id={"attentionListItem3"}/></li>
        <li><T id={"attentionListItem4"}/></li>
      </ul>
      <p className={styles["description"]} style={{textAlign: "start", marginBottom: 20, marginLeft: -24}}>
        <T id={"attentionListTitle2"}/>
      </p>
      <ul className={styles["listContainer"]}>
        <li><T id={"attentionListItem5"}/></li>
        <li><T id={"attentionListItem6"}/></li>
        <li><T id={"attentionListItem7"}/></li>
        <li><T id={"attentionListItem8"}/></li>
      </ul>
      <p className={styles["description"]}>
        <T id={"takeCare"}/>
      </p>
      <p className={styles["description"]} style={{marginBottom: 0, color: "#3182CE"}}>
        <T id={"readMore"}/>
        <a
          href={"https://www.youtube.com/playlist?list=PLVfSwYHwGJ2Gyyf16LEIgvkNoC1YtgjX1"}
          target="_blank"
          rel="noreferrer"
          className={styles["link"]}
          style={{fontSize: 12}}
        >
          link
        </a>
      </p>
      <Button
        className="w-full justify-center border-none"
        style={{
          padding: "10px 2rem",
          background: "#4198e0",
          color: "#ffffff",
          marginTop: "40px",
          borderRadius: 4
        }}
        onClick={() => setStep(0)}>
        <T id={"thanks"}/>
      </Button>
    </>
  );
}

export default AttentionPage;
import React, {FC} from "react";

import {t, T} from "../../../lib/i18n/react";
import {useStorage} from "../../../lib/temple/front";
import Stepper from "../../atoms/Stepper";
import PageLayout from "../../layouts/PageLayout";
import FirstsStep from "./steps/FirstsStep";
import SecondStep from "./steps/SecondStep";
import ThirdStep from "./steps/ThirdStep";

const Onboarding: FC = () => (
  <PageLayout
    pageTitle={
      <>
        <T id="welcomeToOnboarding"/>
      </>
    }
  >
    <OnboardingContent/>
  </PageLayout>
);

export default Onboarding;

const steps = [
  `${t("step")} 1`,
  `${t("step")} 2`,
  `${t("step")} 3`,
  `${t("step")} 4`,
];

const OnboardingContent: FC = () => {
  const [step, setStep] = useStorage<number>(
    `onboarding_step_state`,
    0
  );

  return (
    <div
      style={{maxWidth: "360px", margin: "auto"}}
      className="pb-8 text-center"
    >
      <Stepper style={{marginTop: "40px"}} steps={steps} currentStep={step}/>
      <ThirdStep/>
    </div>
  );
};
import React, {FC} from "react";

import {t, T} from "../../../lib/i18n/react";
import {useStorage} from "../../../lib/temple/front";
import Stepper from "../../atoms/Stepper";
import PageLayout from "../../layouts/PageLayout";
import AttentionPage from "./AttentionPage";
import CongratsPage from "./CongrantsPage";
import FirstStep from "./steps/FirstStep";
import FourthStep from "./steps/FourthStep";
import SecondStep from "./steps/SecondStep";
import ThirdStep from "./steps/ThirdStep";

const steps = [
  `${t("step")} 1`,
  `${t("step")} 2`,
  `${t("step")} 3`,
  `${t("step")} 4`,
];

const Onboarding: FC = () => {
  const [step, setStep] = useStorage<number>(
    `onboarding_step_state`,
    0
  );

  return (
    <PageLayout
      pageTitle={
        <>
          {step >= 1 ? <T id="onboarding"/> : <T id="welcomeToOnboarding"/>}
        </>
      }
    >
      <div
        style={{maxWidth: "360px", margin: "auto"}}
        className="pb-8 text-center"
      >
        <Stepper style={{marginTop: "40px"}} steps={steps} currentStep={step}/>
        {step === 0 && <FirstStep setStep={setStep}/>}
        {step === 1 && <SecondStep setStep={setStep}/>}
        {step === 2 && <ThirdStep setStep={setStep}/>}
        {step === 3 && <FourthStep setStep={setStep}/>}
        {step === 4 && <CongratsPage setStep={setStep}/>}
        {step === 5 && <AttentionPage setStep={setStep}/>}
      </div>
    </PageLayout>
  );
};

export default Onboarding;
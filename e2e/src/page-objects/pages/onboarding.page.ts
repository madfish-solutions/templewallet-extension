// @ts-ignore
import { OnboardingSelectors } from 'src/app/pages/Onboarding/Onboarding.selectors';

import { Page } from '../../classes/page.class';
import { createPageElement } from '../../utils/search.utils';

export class OnboardingFirstStepPage extends Page {
  firstStepText = createPageElement(OnboardingSelectors.firstStepText);
  firstStepNextButton = createPageElement(OnboardingSelectors.firstStepNextButton);

  async isVisible() {
    await this.firstStepText.waitForDisplayed();
    await this.firstStepNextButton.waitForDisplayed();
  }
}

export class OnboardingSecondStepPage extends Page {
  secondStepText = createPageElement(OnboardingSelectors.secondStepText);
  secondStepNextButton = createPageElement(OnboardingSelectors.secondStepNextButton);

  async isVisible() {
    await this.secondStepText.waitForDisplayed();
    await this.secondStepNextButton.waitForDisplayed();
  }
}

export class OnboardingThirdStepPage extends Page {
  thirdStepText = createPageElement(OnboardingSelectors.thirdStepText);
  thirdStepNextButton = createPageElement(OnboardingSelectors.thirdStepNextButton);

  async isVisible() {
    await this.thirdStepText.waitForDisplayed();
    await this.thirdStepNextButton.waitForDisplayed();
  }
}

export class OnboardingFourthStepPage extends Page {
  fourthStepText = createPageElement(OnboardingSelectors.fourthStepText);
  fourthStepDoneButton = createPageElement(OnboardingSelectors.fourthStepDoneButton);

  async isVisible() {
    await this.fourthStepText.waitForDisplayed();
    await this.fourthStepDoneButton.waitForDisplayed();
  }
}

export class OnboardingCongratsPage extends Page {
  congratsText = createPageElement(OnboardingSelectors.congratsText);
  congratsStartButton = createPageElement(OnboardingSelectors.congratsStartButton);

  async isVisible() {
    await this.congratsText.waitForDisplayed();
    await this.congratsStartButton.waitForDisplayed();
  }
}

Feature: Import existing wallet

  Scenario: As a user, I'd like to import account with existing seed phrase
    Given I am on the Welcome page
    And I press Import Existing Wallet button on the Welcome page

    And I am on the ImportExistingWallet page
    And I enter default mnemonic
    And I press Next button on the Import Existing Seed Phrase page

    And I am on the SetWallet page
    And I enter defaultPassword into Password Field on the Register Form page
    And I enter defaultPassword into Repeat Password Field on the Register Form page
    And I press Skip Onboarding Checkbox on the Register Form page
    And I press Analytics Check Box on the Register Form page
    And I press Accept Terms Checkbox on the Register Form page
    And I press Import Button on the Register Form page

    And I am on the NewsletterModal page
    And I press Close Button on the Newsletter Modal page

    Then I am on the Home page



  Scenario: As a user, I'd like to import wallet and pass on-boarding [Positive]
    Given I am on the Welcome page
    And I press Import Existing Wallet button on the Welcome page

    And I am on the ImportExistingWallet page
    And I enter default mnemonic
    And I press Next button on the Import Existing Seed Phrase page

    And I am on the SetWallet page
    And I enter defaultPassword into Password Field on the Register Form page
    And I enter defaultPassword into Repeat Password Field on the Register Form page
    And I press Analytics Check Box on the Register Form page
    And I press Accept Terms Checkbox on the Register Form page
    And I press Import Button on the Register Form page

   # On-boarding passing
    And I am on the OnboardingFirstStep page
    And I press Next Button on the Onboarding (First Step) page

    And I am on the OnboardingSecondStep page
    And I press Next Button on the Onboarding (Second Step) page

    And I am on the OnboardingThirdStep page
    And I press Next Button on the Onboarding (Third Step) page

    And I am on the OnboardingFourthStep page
    And I press Done Button on the Onboarding (Fourth Step) page

    And I am on the OnboardingCongrats page
    And I press Start Button on the Onboarding (Congrats) page

    And I am on the NewsletterModal page
    And I press Close Button on the Newsletter Modal page

    Then I am on the Home page


  Scenario: As a user, I'd like to switch between onboarding pages and skip it [Negative]
    Given I am on the Welcome page
    And I press Import Existing Wallet button on the Welcome page

    And I am on the ImportExistingWallet page
    And I enter default mnemonic
    And I press Next button on the Import Existing Seed Phrase page

    And I am on the SetWallet page
    And I enter defaultPassword into Password Field on the Register Form page
    And I enter defaultPassword into Repeat Password Field on the Register Form page
    And I press Analytics Check Box on the Register Form page
    And I press Accept Terms Checkbox on the Register Form page
    And I press Import Button on the Register Form page

   # On-boarding passing
    And I am on the OnboardingFirstStep page
    And I press Next Button on the Onboarding (First Step) page

    And I am on the OnboardingSecondStep page
    And I press Next Button on the Onboarding (Second Step) page

    And I am on the OnboardingThirdStep page
    And I press Next Button on the Onboarding (Third Step) page

    And I am on the OnboardingFourthStep page
  # Returning to the previous page
    And I press Back Button on the Page Layout page

    And I am on the OnboardingThirdStep page
    And I press Skip Button on the Page Layout page

    And I am on the NewsletterModal page
    And I press Close Button on the Newsletter Modal page

    Then I am on the Home page



Feature: Create a new wallet

  Scenario: As a user, i'd like to create a new wallet
    Given I am on the Welcome page
    And I press Create New Wallet button on the Welcome page

    And I am on the NewSeedBackup page
    And I press Protected Mask on the New Seed Back-up page
    And I save my mnemonic
    And I press I made Seed Phrase Backup Check Box on the New Seed Back-up page
    And I press Next Button on the New Seed Back-up page

    And I am on the VerifyMnemonic page
    And I verify my mnemonic
    And I press Next Button on the New Seed Verify page

    And I am on the SetWallet page
    And I enter defaultPassword into Password Field on the Register Form page
    And I enter defaultPassword into Repeat Password Field on the Register Form page
    And I press Analytics Check Box on the Register Form page
    And I press Skip Onboarding Checkbox on the Register Form page
    And I press Accept Terms Checkbox on the Register Form page
    And I press Create Button on the Register Form page

    And I am on the OnRumpModal page
    And I press Close Button on the On-ramp Modal page

    And I am on the NewsletterModal page
    And I press Close Button on the Newsletter Modal page

    Then I am on the Home page



  Scenario: As a user, I'd like to create a wallet and pass on-boarding
      Given I am on the Welcome page
      And I press Create New Wallet button on the Welcome page

      And I am on the NewSeedBackup page
      And I press Protected Mask on the New Seed Back-up page
      And I save my mnemonic
      And I press I made Seed Phrase Backup Check Box on the New Seed Back-up page
      And I press Next Button on the New Seed Back-up page

      And I am on the VerifyMnemonic page
      And I verify my mnemonic
      And I press Next Button on the New Seed Verify page

      And I am on the SetWallet page
      And I enter defaultPassword into Password Field on the Register Form page
      And I enter defaultPassword into Repeat Password Field on the Register Form page
      And I press Analytics Check Box on the Register Form page
      And I press Accept Terms Checkbox on the Register Form page
      And I press Create Button on the Register Form page
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

      And I am on the OnRumpModal page
      And I press Close Button on the On-ramp Modal page

      And I am on the NewsletterModal page
      And I press Close Button on the Newsletter Modal page

      Then I am on the Home page



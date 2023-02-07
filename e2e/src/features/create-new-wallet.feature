Feature: Create a new wallet
  Scenario: As a user, i'd like to create a new wallet
    Given I am on the Welcome page
    And I press Create New Wallet button on the Welcome page

    And I am on the NewSeedBackup page
    And I press Protected Mask on the NewSeedBackup page
    And I save my mnemonic
    And I press I made Seed Phrase Backup Check Box on the NewSeedBackup page
    And I press Next Button on the NewSeedBackup page

    And I am on the VerifyMnemonic page
    And I verify my mnemonic
    And I press Next Button on the NewSeedVerify page

    And I am on the SetWallet page
    And I enter default password into Password Field on the Register Form page
    And I enter default password into Repeat Password Field on the Register Form page
    And I press Skip Onboarding Checkbox on the Register Form page
    And I press Accept Terms Checkbox on the Register Form page
    And I press Create Button on the Register Form page

    Then I am on the Home page


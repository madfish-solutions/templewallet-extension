Feature: Create a new wallet

@create_new_wallet
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
    And I press Accept Terms Checkbox on the Register Form page
    And I press Create Button on the Register Form page

    And I am on the OnRumpModal page
    And I press Close Button on the On-ramp Modal page

    And I am on the NewsletterModal page
    And I press Close Button on the Newsletter Modal page

    Then I am on the Home page


# TODO: add a scenario for passing an onboarding



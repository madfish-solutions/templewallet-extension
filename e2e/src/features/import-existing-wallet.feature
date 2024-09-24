Feature: Import existing wallet

@import_wallet
  Scenario: As a user, I'd like to import account with existing seed phrase
    Given I am on the Welcome page
    And I press Import Existing Wallet button on the Welcome page

    And I am on the ImportExistingWallet page
    And I enter defaultSeedPhrase mnemonic on the ImportExistingWallet page
    And I press Next button on the Import Existing Seed Phrase page

    And I am on the SetWallet page
    And I enter defaultPassword into Password Field on the Register Form page
    And I enter defaultPassword into Repeat Password Field on the Register Form page
    And I press Analytics Check Box on the Register Form page
    And I press Accept Terms Checkbox on the Register Form page
    And I press Import Button on the Register Form page

    And I am on the NewsletterModal page
    And I press Close Button on the Newsletter Modal page

    Then I am on the Home page



  # TODO: add scenarios for passing onboarding



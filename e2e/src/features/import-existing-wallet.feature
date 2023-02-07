Feature: Import existing wallet
  Scenario: As a user, I'd like to import account with existing seed phrase
    Given I am on the Welcome page
    And I press Import Existing Wallet button on the Welcome page

    And I am on the ImportExistingWallet page
    And I enter default mnemonic
    And I press Next button on the Import Existing Seed Phrase page

    And I am on the SetWallet page
    And I enter default password into Password Field on the Register Form page
    And I enter default password into Repeat Password Field on the Register Form page
    And I press Skip Onboarding Checkbox on the Register Form page
    And I press Accept Terms Checkbox on the Register Form page
    And I press Import Button on the Register Form page

    Then I am on the Home page


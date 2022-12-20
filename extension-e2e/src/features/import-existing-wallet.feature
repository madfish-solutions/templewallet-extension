Feature: Import existing wallet
  @dev
  Scenario: As a user, I'd like to import account with existing seed phrase
    Given I am on the Welcome page
    And I press Import Existing Wallet button on the Welcome the page

    And I am on the ImportExistingWallet page
#   And I enter my mnemonic
    And I press Next button on the Import Existing Seed Phrase the page

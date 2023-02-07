Feature: Import Account by Mnemonic
  Scenario: As a user, I'd like to import account by mnemonic
    Given I have imported an existing account

    And I press AccountIcon on the Header page
    And I am on the AccountsDropdown page

    And I press ImportAccountButton on the AccountsDropdown page
    And I am on the ImportAccountTab page

    And I select Mnemonic tab
    And I am on the ImportAccountMnemonic page

    And I enter second mnemonic
    And I press Mnemonic Import Button on the Import Account(Mnemonic) page

    Then I reveal a private key and compare with private key second seed phrase

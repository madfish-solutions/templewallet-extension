Feature: Import Account by Mnemonic

@import_account_mnemonic
  Scenario: As a user, I'd like to import account by mnemonic
    Given I have imported an existing account

    And I press Account Icon on the Header page
    And I am on the AccountsDropdown page

    And I press Import Account Button on the Account Drop-down page
    And I am on the ImportAccountTab page

    And I select Mnemonic tab
    And I am on the ImportAccountMnemonic page

    And I enter second mnemonic
    And I press Mnemonic Import Button on the Import Account(Mnemonic) page

    Then I reveal a private key and compare with importedFirstPrivateKey


  Scenario: As a user, I'd like to import account by mnemonic with derivation path + password field
    Given I have imported an existing account

    And I press Account Icon on the Header page
    And I am on the AccountsDropdown page

    And I press Import Account Button on the Account Drop-down page
    And I am on the ImportAccountTab page

    And I select Mnemonic tab
    And I am on the ImportAccountMnemonic page

    And I enter second mnemonic
    And I press Mnemonic Import Button on the Import Account(Mnemonic) page

    And I am on the Home page
    And I check if importedAccountShortHash is corresponded to the selected account

#    importing an account with derivation path
    And I press Account Icon on the Header page
    And I am on the AccountsDropdown page

    And I press Import Account Button on the Account Drop-down page
    And I am on the ImportAccountTab page

    And I select Mnemonic tab
    And I am on the ImportAccountMnemonic page

    And I enter second mnemonic

    And I press Custom Derivation Path Button on the Import Account(Mnemonic) page
    And I clear Custom Derivation Path Input value on the Import Account(Mnemonic) page
    And I enter customDerivationPath into Custom Derivation Path Input on the Import Account(Mnemonic) page
    And I scroll 900 pixels on the ImportAccountMnemonic page
    And I press Mnemonic Import Button on the Import Account(Mnemonic) page

    And I am on the Home page
    And I check if importedAccountDerPathShortHash is corresponded to the selected account

#    importing an account with additional 'Password' input
    And I press Account Icon on the Header page
    And I am on the AccountsDropdown page

    And I press Import Account Button on the Account Drop-down page
    And I am on the ImportAccountTab page

    And I select Mnemonic tab
    And I am on the ImportAccountMnemonic page

    And I enter second mnemonic
    And I scroll 900 pixels on the ImportAccountMnemonic page
    And I enter amount_1 into Mnemonic Password Input on the Import Account(Mnemonic) page
    And I press Mnemonic Import Button on the Import Account(Mnemonic) page

    And I am on the Home page
    Then I check if importedAccountByPasswordShortHash is corresponded to the selected account



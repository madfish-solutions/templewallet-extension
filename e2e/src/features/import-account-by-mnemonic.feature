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

    And I enter importedSeedPhrase mnemonic on the ImportAccountMnemonic page
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

    And I enter importedSeedPhrase mnemonic on the ImportAccountMnemonic page
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

    And I enter importedSeedPhrase mnemonic on the ImportAccountMnemonic page

    And I scroll 200 pixels on the ImportAccountMnemonic page
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

    And I enter importedSeedPhrase mnemonic on the ImportAccountMnemonic page
    And I scroll 900 pixels on the ImportAccountMnemonic page
    And I enter amount_1 into Mnemonic Password Input on the Import Account(Mnemonic) page
    And I press Mnemonic Import Button on the Import Account(Mnemonic) page

    And I am on the Home page
    Then I check if importedAccountByPasswordShortHash is corresponded to the selected account



  Scenario: Import account by mnemonic validation + negative cases
    Given I have imported an existing account

    And I press Account Icon on the Header page
    And I am on the AccountsDropdown page

    And I press Import Account Button on the Account Drop-down page
    And I am on the ImportAccountTab page

    And I select Mnemonic tab
    And I am on the ImportAccountMnemonic page
# validation checks 12 words seed
    And I scroll 900 pixels on the ImportAccountMnemonic page
    And I press Mnemonic Import Button on the Import Account(Mnemonic) page
    And I got the validation-error 'Seed phrase must contain 12 words' with Mnemonic Validation Error Text element on the Import (Account/Wallet) page
    And I scroll -300 pixels on the ImportAccountMnemonic page
    And The Mnemonic Drop Down Button on the Import (Account/Wallet) page has correct My Seed phrase is 12 words  value
# validation checks 24 words seed
    And I press Mnemonic Drop Down Button on the Import (Account/Wallet) page
    And I select mnemonic with 24 words
    And I scroll 900 pixels on the ImportAccountMnemonic page
    And I press Mnemonic Import Button on the Import Account(Mnemonic) page
    And I got the validation-error 'Seed phrase must contain 24 words' with Mnemonic Validation Error Text element on the Import (Account/Wallet) page

   And I reload the page
   And I am on the ImportAccountMnemonic page

#  validation checks word inputs with 'invalidRandomSeedPhrase'
   And I enter invalidRandomSeedPhrase mnemonic on the ImportAccountMnemonic page
   And I scroll 300 pixels on the ImportAccountMnemonic page
   And I press Mnemonic Import Button on the Import Account(Mnemonic) page
   And I got the validation-error 'Invalid Seed Phrase' with Mnemonic Validation Error Text element on the Import (Account/Wallet) page

   And I scroll -300 pixels on the ImportAccountMnemonic page
   And I clear entered mnemonic on the ImportAccountMnemonic page

#  validation checks word inputs with 'incorrectSeedPhrase'
  And I enter incorrectSeedPhrase mnemonic on the ImportAccountMnemonic page
  And I scroll 300 pixels on the ImportAccountMnemonic page
  And I press Mnemonic Import Button on the Import Account(Mnemonic) page
  And I got the validation-error 'Invalid Seed PhraseMake sure the words spelled correctly' with Mnemonic Validation Error Text element on the Import (Account/Wallet) page

  And I scroll -300 pixels on the ImportAccountMnemonic page
  And I clear entered mnemonic on the ImportAccountMnemonic page

#  validation checks word inputs with 'invalidSeedPhrase'
  And I enter invalidSeedPhrase mnemonic on the ImportAccountMnemonic page
  And I scroll 300 pixels on the ImportAccountMnemonic page
  And I press Mnemonic Import Button on the Import Account(Mnemonic) page
  And I got the validation-error 'Invalid Seed Phrase' with Mnemonic Validation Error Text element on the Import (Account/Wallet) page

  And I scroll -300 pixels on the ImportAccountMnemonic page
  And I clear entered mnemonic on the ImportAccountMnemonic page

#  validation checks custom derivation path input
  And I scroll 200 pixels on the ImportAccountMnemonic page
  And I press Custom Derivation Path Button on the Import Account(Mnemonic) page
  And I clear Custom Derivation Path Input value on the Import Account(Mnemonic) page

#  importing 24 words seed
  And I scroll -300 pixels on the ImportAccountMnemonic page
  And I press Mnemonic Drop Down Button on the Import (Account/Wallet) page
  And I select mnemonic with 24 words
  And I enter longSeedPhrase24 mnemonic on the ImportAccountMnemonic page
  And I scroll 900 pixels on the ImportAccountMnemonic page

  And I press Mnemonic Import Button on the Import Account(Mnemonic) page

  And I am on the Home page
  And I check if longFirstAccountShortHash is corresponded to the selected account

#  checking derivation type validation
  And I press Account Icon on the Header page
  And I am on the AccountsDropdown page

  And I press Import Account Button on the Account Drop-down page
  And I am on the ImportAccountTab page

  And I select Mnemonic tab
  And I am on the ImportAccountMnemonic page

  And I enter importedSeedPhrase mnemonic on the ImportAccountMnemonic page
  And I press Custom Derivation Path Button on the Import Account(Mnemonic) page
  And I scroll 900 pixels on the ImportAccountMnemonic page
  And I clear Custom Derivation Path Input value on the Import Account(Mnemonic) page
  And I enter shortRandomContent into Custom Derivation Path Input on the Import Account(Mnemonic) page
  And I press Mnemonic Import Button on the Import Account(Mnemonic) page

  And I got the validation-error 'Must start with 'm'' with Input Error element on the Universal Component page

   # invalid path validation
  And I clear Custom Derivation Path Input value on the Import Account(Mnemonic) page
  And I enter invalidDerivationPath into Custom Derivation Path Input on the Import Account(Mnemonic) page
  And I press Mnemonic Import Button on the Import Account(Mnemonic) page

  And I got the validation-error 'Invalid path' with Input Error element on the Universal Component page

  And I clear Custom Derivation Path Input value on the Import Account(Mnemonic) page
  And I enter secondInvalidDerivationPath into Custom Derivation Path Input on the Import Account(Mnemonic) page
  And I press Mnemonic Import Button on the Import Account(Mnemonic) page

  And I got the validation-error 'Invalid path' with Input Error element on the Universal Component page

  And I clear Custom Derivation Path Input value on the Import Account(Mnemonic) page
  And I enter thirdInvalidDerivationPath into Custom Derivation Path Input on the Import Account(Mnemonic) page
  And I press Mnemonic Import Button on the Import Account(Mnemonic) page

  And I got the validation-error 'Invalid path' with Input Error element on the Universal Component page

  And I clear Custom Derivation Path Input value on the Import Account(Mnemonic) page
  And I enter fourthInvalidDerivationPath into Custom Derivation Path Input on the Import Account(Mnemonic) page
  And I press Mnemonic Import Button on the Import Account(Mnemonic) page

  And I got the validation-error 'Invalid path' with Input Error element on the Universal Component page

#  valid importing to finish the scenario
  And I clear Custom Derivation Path Input value on the Import Account(Mnemonic) page
  And I enter basicDerivationPath into Custom Derivation Path Input on the Import Account(Mnemonic) page
  And I press Mnemonic Import Button on the Import Account(Mnemonic) page

  And I am on the Home page
  Then I check if importedAccountShortHash is corresponded to the selected account

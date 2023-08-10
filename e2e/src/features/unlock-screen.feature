Feature: Unlock Screen
@unlock_screen
  Scenario: As a user, I'd like to unlock my wallet [Positive]
    Given I have imported an existing account
    And I press Account Icon on the Header page

    And I am on the AccountsDropdown page
    And I press Logout Button on the Account Drop-down page

    And I am on the UnlockScreen page
    And I enter defaultPassword into Password Input on the Unlock page
    And I press Unlock Button on the Unlock page

    Then I am on the Home page


@unlock_screen
  Scenario: As a user, I'd like to check validation on the unlock wallet screen [Negative]
    Given I have imported an existing account
    And I press Account Icon on the Header page

    And I am on the AccountsDropdown page
    And I press Logout Button on the Account Drop-down page

    And I am on the UnlockScreen page
    And I press Unlock Button on the Unlock page

    And I got the validation-error 'Required' with Input Error element on the Universal Component page

# unlocking the wallet after getting 'Required' error
    And I enter defaultPassword into Password Input on the Unlock page
    And I press Unlock Button on the Unlock page

    And I am on the Home page
    And I press Account Icon on the Header page

    And I am on the AccountsDropdown page
    And I press Logout Button on the Account Drop-down page

    And I am on the UnlockScreen page
    And I enter shortRandomContent into Password Input on the Unlock page
    And I press Unlock Button on the Unlock page

    And I got the validation-error 'Invalid password' with Input Error element on the Universal Component page

# unlocking the wallet after getting 'Invalid password' error
    And I clear Password Input value on the Unlock page
    And I enter defaultPassword into Password Input on the Unlock page
    And I press Unlock Button on the Unlock page

    And I am on the Home page
    And I press Account Icon on the Header page

    And I am on the AccountsDropdown page
    And I press Logout Button on the Account Drop-down page

    And I am on the UnlockScreen page
    And I press Unlock Button on the Unlock page

# entering 3 times incorrect password to get time-lock error
    And I enter shortRandomContent into Password Input on the Unlock page
    And I press Unlock Button on the Unlock page
    And I got the validation-error 'Invalid password' with Input Error element on the Universal Component page

    And I enter shortRandomContent into Password Input on the Unlock page
    And I press Unlock Button on the Unlock page
    And I got the validation-error 'Invalid password' with Input Error element on the Universal Component page

    And I enter shortRandomContent into Password Input on the Unlock page
    And I press Unlock Button on the Unlock page
    And I got the validation-error 'Invalid password' with Input Error element on the Universal Component page

    And I wait until the time error goes away

# unlocking the wallet after getting time-lock error
    And I clear Password Input value on the Unlock page
    And I enter defaultPassword into Password Input on the Unlock page
    And I press Unlock Button on the Unlock page

    And I am on the Home page
    And I press Account Icon on the Header page

    And I am on the AccountsDropdown page
    And I press Logout Button on the Account Drop-down page

# unlocking the wallet after getting all validations errors (error by error)
    And I am on the UnlockScreen page
    And I press Unlock Button on the Unlock page
    And I got the validation-error 'Required' with Input Error element on the Universal Component page

    And I enter shortRandomContent into Password Input on the Unlock page
    And I press Unlock Button on the Unlock page
    And I got the validation-error 'Invalid password' with Input Error element on the Universal Component page


    And I enter shortRandomContent into Password Input on the Unlock page
    And I press Unlock Button on the Unlock page
    And I got the validation-error 'Invalid password' with Input Error element on the Universal Component page

    And I enter shortRandomContent into Password Input on the Unlock page
    And I press Unlock Button on the Unlock page
    And I got the validation-error 'Invalid password' with Input Error element on the Universal Component page

    And I wait until the time error goes away

    And I clear Password Input value on the Unlock page
    And I enter defaultPassword into Password Input on the Unlock page
    And I press Unlock Button on the Unlock page

    Then I am on the Home page


@unlock_screen
  Scenario: As a user, i'd like to restore my wallet from unlock screen page (if i forgot a password)
    Given I have imported an existing account
    And I press Account Icon on the Header page

    And I am on the AccountsDropdown page
    And I press Logout Button on the Account Drop-down page

    And I am on the UnlockScreen page
    And I press Import Wallet using Seed Phrase Link on the Unlock page

# restore a wallet another (second) mnemonic
    And I am on the ImportExistingWallet page
    And I got the 'Attention!' warning with Alert title Text element on the Alert page
    And I enter default mnemonic
    And I press Next button on the Import Existing Seed Phrase page

    And I am on the SetWallet page
    And I got the 'Attention!' warning with Alert title Text element on the Alert page
    And I enter defaultPassword into Password Field on the Register Form page
    And I enter defaultPassword into Repeat Password Field on the Register Form page
    And I press Skip Onboarding Checkbox on the Register Form page
    And I press Analytics Check Box on the Register Form page
    And I press Accept Terms Checkbox on the Register Form page
    And I press Import Button on the Register Form page

    And I am on the NewsletterModal page
    And I press Close Button on the Newsletter Modal page

    And I am on the Home page
# checking that restored account(wallet) is corresponded to the mnemonic I entered after loosing previous account(wallet)
    Then I check if defaultAccountShortHash is corresponded to the selected account

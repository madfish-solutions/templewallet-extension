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

    And I got the 'Required' error with Input Error element on the Universal Component page

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

    And I got the 'Invalid password' error with Input Error element on the Universal Component page

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
    And I got the 'Invalid password' error with Input Error element on the Universal Component page

    And I enter shortRandomContent into Password Input on the Unlock page
    And I press Unlock Button on the Unlock page
    And I got the 'Invalid password' error with Input Error element on the Universal Component page

    And I enter shortRandomContent into Password Input on the Unlock page
    And I press Unlock Button on the Unlock page
    And I got the 'Invalid password' error with Input Error element on the Universal Component page

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
    And I got the 'Required' error with Input Error element on the Universal Component page

    And I enter shortRandomContent into Password Input on the Unlock page
    And I press Unlock Button on the Unlock page
    And I got the 'Invalid password' error with Input Error element on the Universal Component page

    And I enter shortRandomContent into Password Input on the Unlock page
    And I press Unlock Button on the Unlock page
    And I got the 'Invalid password' error with Input Error element on the Universal Component page

    And I enter shortRandomContent into Password Input on the Unlock page
    And I press Unlock Button on the Unlock page
    And I got the 'Invalid password' error with Input Error element on the Universal Component page

    And I wait until the time error goes away

    And I clear Password Input value on the Unlock page
    And I enter defaultPassword into Password Input on the Unlock page
    And I press Unlock Button on the Unlock page

    Then I am on the Home page


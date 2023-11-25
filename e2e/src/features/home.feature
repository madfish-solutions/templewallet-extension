Feature: Check functional on the Home page

  @home
  Scenario: As a user, i'd like to check functional on the main 'Home' page
    Given I have imported an existing account

    And The Fiat-Tez Switch Button on the Home page has correct $ value
    And The Fiat-Tez Switch Text on the Home page has correct Total Equity Value value

    And I press Fiat-Tez Switch Button on the Home page
    And The Fiat-Tez Switch Text on the Home page has correct Tezos Balance value

    And I enter shortRandomContent into Search Assets Input (Tokens) on the Assets page
#  empty state error
    And The Empty State Text on the Home page has correct No assets found value
    And I clear Search Assets Input (Tokens) value on the Assets page
    And The Asset Item Button is displayed on the Assets page

#  hide 0 balances
    And I press Manage Dropdown Button on the Assets page
    And I press Hide Zero Balances Checkbox on the Assets (Manage Dropdown) page
      #  to hide manage drop-down list
    And I press Manage Dropdown Button on the Assets page
    And I scroll 900 pixels on the Home page

    Then I check that tokens with zero balances are hidden




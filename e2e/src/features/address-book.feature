Feature: Address book
@address_book
  Scenario: As a user, I'd like to add contact
    Given I have imported an existing account

    And I press Account Icon on the Header page
    And I am on the AccountsDropdown page
    And I press Settings Button on the Account Drop-down page

    And I am on the Settings page
    And I press Address Book Button on the Settings page

    And I am on the AddressBook page
    And I enter contactPublicKey into Address Input on the Address Book page
    And I enter shortRandomContent into Name Input on the Address Book page
    And I press Add Contact Button on the Address Book page

    Then I check if added contact is added and displayed

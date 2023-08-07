Feature: Address book
@address_book
  Scenario: As a user, I'd like to add contact [Positive]
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

    And I check if added contact = 'tz1aWpVn8k5aZvVaCKPMdcPeX8ccm5662SLL' is displaying 'Current contacts' list
    Then I check if added contact = 'tz1aWpVn8k5aZvVaCKPMdcPeX8ccm5662SLL' is displayed in the 'Recipient' drop-down on the Send Page


#@address_book
@dev
  Scenario: As a user, I'd like to remove contact [Positive]
    Given I have imported an existing account

    And I press Account Icon on the Header page
    And I am on the AccountsDropdown page
    And I press Settings Button on the Account Drop-down page

    And I am on the Settings page
    And I press Address Book Button on the Settings page

    And I am on the AddressBook page
#  First contact adding
    And I enter contactPublicKey into Address Input on the Address Book page
    And I enter shortRandomContent into Name Input on the Address Book page
    And I press Add Contact Button on the Address Book page
#  Second contact adding
    And I clear Address Input value on the Address Book page
    And I enter secondContactPublicKey into Address Input on the Address Book page
    And I enter longRandomContent into Name Input on the Address Book page
    And I press Add Contact Button on the Address Book page


    And I find an added contact = 'tz1aWpVn8k5aZvVaCKPMdcPeX8ccm5662SLL' and click to delete it

    And I am on the ConfirmationModal page
    And I press Ok Button on the Confirmation Modal page
    And I check if added contact = 'tz1aWpVn8k5aZvVaCKPMdcPeX8ccm5662SLL' is deleted from the 'Current contacts' list

#  It runs for understanding that other contacts are not deleted
    Then I check if added contact = 'tz1eSbADvrQzhH6vWP6MUy6VoEiGPJJZj696' is displaying 'Current contacts' list


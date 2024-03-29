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

    And I scroll 500 pixels on the AddressBook page
    And I check if added contact = 'contactPublicKey' is displayed on 'Current contacts' list
    Then I check if added contact = 'contactPublicKey' is displayed in the 'Recipient' drop-down on the Send Page


@address_book
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
    And I scroll 800 pixels on the AddressBook page
    And I check if added contact = 'contactPublicKey' is displayed on 'Current contacts' list
#  Second contact adding
    And I clear Address Input value on the Address Book page
    And I enter secondContactPublicKey into Address Input on the Address Book page
    And I enter longRandomContent into Name Input on the Address Book page
    And I press Add Contact Button on the Address Book page
    And I scroll 800 pixels on the AddressBook page
    And I check if added contact = 'secondContactPublicKey' is displayed on 'Current contacts' list


    And I find an added contact = 'contactPublicKey' and click to delete it

    And I am on the ConfirmationModal page
    And I press Ok Button on the Confirmation Modal page
    And I check if added contact = 'contactPublicKey' is deleted from the 'Current contacts' list

#  It runs for understanding that other contacts are not deleted
    Then I check if added contact = 'secondContactPublicKey' is displayed on 'Current contacts' list


@address_book
  Scenario: Validation check on Address Book page [Negative]
    Given I have imported an existing account

    And I press Account Icon on the Header page
    And I am on the AccountsDropdown page
    And I press Settings Button on the Account Drop-down page

    And I am on the Settings page
    And I press Address Book Button on the Settings page

    And I am on the AddressBook page
  #  both inputs validation
    And I press Add Contact Button on the Address Book page
    And I got the validation-error 'Required' in the Address Input Section on the Address Book page
    And I got the validation-error 'Required' in the Name Input Section on the Address Book page
  #  Address input
    And I enter shortRandomContent into Address Input on the Address Book page
    And I got the validation-error 'Invalid address or domain name' in the Address Input Section on the Address Book page

    And I clear Address Input value on the Address Book page
    And I enter contactPublicKey into Address Input on the Address Book page
    And I enter shortRandomContent into Name Input on the Address Book page
    And I press Add Contact Button on the Address Book page

    And I scroll 800 pixels on the AddressBook page
    And I check if added contact = 'contactPublicKey' is displayed on 'Current contacts' list
     #  repeat for getting duplicate validation error
    And I enter contactPublicKey into Address Input on the Address Book page
    And I enter shortRandomContent into Name Input on the Address Book page
    And I press Add Contact Button on the Address Book page

    And I got the validation-error 'Contact with the same address already exists' in the Address Input Section on the Address Book page






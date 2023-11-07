Feature: Switch account
  Scenario: As a user, I'd like to switch between my accounts
    Given I have imported an existing account
#    creating or restoring second hd account
    And I press Account Icon on the Header page
    And I am on the AccountsDropdown page

    And I press Create Or Restore Account Button on the Account Drop-down page
    And I am on the CreateOrRestoreAnAccount page

    And I press Create Or Restore Button on the Create Account page
    And I am on the Home page
    And I check if defaultSecondAccountShortHash is corresponded to the selected account

#   importing an account by private key
    And I press Account Icon on the Header page
    And I am on the AccountsDropdown page

    And I press Import Account Button on the Account Drop-down page
    And I am on the ImportAccountTab page

    And I select Private Key tab
    And I am on the ImportAccountPrivateKey page

    And I enter importedFirstPrivateKey into Private Key Input on the Import Account(Private Key) page
    And I press Private Key Import Button on the Import Account(Private Key) page
    And I am on the Home page
    And I check if importedAccountShortHash is corresponded to the selected account

#   importing an watch-only account
    And I press Account Icon on the Header page
    And I am on the AccountsDropdown page

    And I press Import Account Button on the Account Drop-down page
    And I am on the ImportAccountTab page

    And I select Watch-only tab
    And I am on the ImportAccountWatchOnly page

    And I enter watchOnlyPublicKey into Watch Only Input on the Import Account(Watch-Only) page
    And I press Watch Only Import Button on the Import Account(Watch-Only) page

    And I check if watchOnlyAccountShortHash is corresponded to the selected account
#  switching between all accounts (checking account public hash + account name)
    And I press Account Icon on the Header page
    And I am on the AccountsDropdown page

    #  switching from the fourth to the first account
    And I select defaultFirstAccount in the Account drop-down
    And I am on the Home page
    And I check if defaultFirstAccountShortHash is corresponded to the selected account
    And The Account Name Text on the Home page has correct Account 1 value

    And I press Account Icon on the Header page
    And I am on the AccountsDropdown page

    #  switching from the first to the second account
    And I select defaultSecondAccount in the Account drop-down
    And I am on the Home page
    And I check if defaultSecondAccountShortHash is corresponded to the selected account
    And The Account Name Text on the Home page has correct Account 2 value

    And I press Account Icon on the Header page
    And I am on the AccountsDropdown page

    #  switching from the second to the third account
    And I select importedAccount in the Account drop-down
     And I am on the Home page
    And I check if importedAccountShortHash is corresponded to the selected account
    And The Account Name Text on the Home page has correct Account 3 value

    And I press Account Icon on the Header page
    And I am on the AccountsDropdown page

    #  switching from the third to the fourth account
    And I select watchOnlyAccount in the Account drop-down
    And I check if watchOnlyAccountShortHash is corresponded to the selected account

    Then The Account Name Text on the Home page has correct Watch-only 1 value


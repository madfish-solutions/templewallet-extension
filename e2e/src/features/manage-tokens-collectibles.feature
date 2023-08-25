Feature: Manage tokens + collectibles
@manage_assets

  Scenario: As a user, I'd like to add tokens and collectibles to my wallet [Positive]
    Given I have imported an existing account
    And I press Manage Button on the Assets page

    And I am on the ManageAssetsTokens page
    And I press Add Asset Button on the Manage Assets(Tokens) page

    And I am on the AddAsset page
    And I enter shitTokenContractAddress into Address Input on the Add Asset page
    And I wait until other inputs load after entering a token address
    And I scroll 500 pixels on the AddAsset page
    And I press Add Asset Button on the Add Asset page

    And I am on the Token page
    And I check that KLL page with Killer token displayed or selected correctly
    And I press Temple Logo Icon on the Header page

    And I am on the Home page
    And I scroll 900 pixels on the Home page

    Then I check the token with name Killer is displayed on the Home page


@manage_assets
@dev
  Scenario: As a user, I'd like to hide and delete tokens [Positive]
    Given I have imported an existing account
#  Hide hardcoded token
    And I press Manage Button on the Assets page

    And I am on the ManageAssetsTokens page
    And I check that kUSD is in the 'Manage Tokens' list
    # hide
    And I click on visible token checkbox of kUSD token to hide or reveal it

#
#    # delete token
#    And I click on delete token button of kUSD to reach confirm modal page
#
#    And I am on the ConfirmationModal page
#    And I press Ok Button on the Confirmation Modal page
#
#    And I check that kUSD token is deleted from token list
##   Checking that the token disappears on the Home page
#    And I press Temple Logo Icon on the Header page
#
#    And I am on the Home page
#    And I scroll 900 pixels on the Home page
#
#    Then I check the token with name Kolibri is NOT displayed on the Home page
#

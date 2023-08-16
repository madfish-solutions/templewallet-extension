Feature: Manage tokens + collectibles
@dev
  Scenario: As a user, I'd like to add tokens and collectibles to my wallet
    Given I have imported an existing account
    And I press Manage Button on the Assets page

    And I am on the ManageAssetsTokens page
    And I press Add Asset Button on the Manage Assets(Tokens) page

    And I am on the AddAsset page

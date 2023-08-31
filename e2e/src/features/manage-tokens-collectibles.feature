Feature: Manage tokens + collectibles
@manage_assets
  Scenario: As a user, I'd like to add tokens and collectibles to my wallet
    Given I have imported an existing account
    And I press Manage Button on the Assets page

    And I am on the ManageAssetsTokens page
    And I press Add Asset Button on the Manage Assets(Tokens) page

    And I am on the AddAsset page
    And I enter customTokenContractAddress into Address Input on the Add Asset page
    And I wait until other inputs load after entering a token address
    And I scroll 500 pixels on the AddAsset page
    And I press Add Asset Button on the Add Asset page

    And I am on the Token page
    And I check that KLL page with Killer token displayed or selected correctly
    And I press Temple Logo Icon on the Header page

    And I am on the Home page
    And I scroll 900 pixels on the Home page

    Then I check the Killer token is displayed on the Home page



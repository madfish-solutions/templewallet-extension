Feature: Manage tokens + collectibles
@manage_assets

  Scenario: As a user, I'd like to add tokens and collectibles to my wallet [Positive]
    Given I have imported an existing account
    And I press Manage Dropdown Button on the Assets page
    And I press Manage Button on the Assets (Manage Dropdown) page

    And I am on the ManageAssetsTokens page
    And I press Add Asset Button on the Manage Assets(Tokens) page

    And I am on the AddAsset page
    And I enter customTokenContractAddress into Address Input on the Add Asset page
    And I wait until adding asset customTokenName is preloaded
    And I scroll 500 pixels on the AddAsset page
    And I press Add Asset Button on the Add Asset page

    And I am on the Token page
    And I check that customTokenSymbol page with customTokenName token displayed or selected correctly
    And I press Temple Logo Icon on the Header page

    And I am on the Home page
    And I scroll 900 pixels on the Home page

    Then I check the token with name Killer is displayed on the Home page


@manage_assets
  Scenario: As a user, I'd like to hide and delete tokens [Positive]
    Given I have imported an existing account
#  hardcoded token

    And I press Manage Dropdown Button on the Assets page
    And I press Manage Button on the Assets (Manage Dropdown) page

    And I am on the ManageAssetsTokens page
    And I check that kUSD is in the 'Manage Tokens' list
    # hide
    And I click on kUSD token label to hide or reveal it
  #   checking that the token disappears on the Home page
    And I press Temple Logo Icon on the Header page

    And I am on the Home page
    And I scroll 900 pixels on the Home page

    And I check the token with name Kolibri is NOT displayed on the Home page
    And I scroll -600 pixels on the Home page
    And I press Manage Dropdown Button on the Assets page
    And I press Manage Button on the Assets (Manage Dropdown) page

    And I am on the ManageAssetsTokens page
    And I check that kUSD is in the 'Manage Tokens' list
    # reveal
    And I click on kUSD token label to hide or reveal it
  #   checking that the token displays on the Home page
    And I press Temple Logo Icon on the Header page

    And I am on the Home page
    And I scroll 900 pixels on the Home page
    And I check the token with name Kolibri is displayed on the Home page

    # delete token
    And I press Manage Dropdown Button on the Assets page
    And I press Manage Button on the Assets (Manage Dropdown) page

    And I am on the ManageAssetsTokens page
    And I check that kUSD is in the 'Manage Tokens' list
    And I click on delete token button of kUSD to reach confirm modal page

    And I am on the ConfirmationModal page
    And I press Ok Button on the Confirmation Modal page

    And I check that kUSD token is deleted from token list
#   checking that the token disappears on the Home page
    And I press Temple Logo Icon on the Header page

    And I am on the Home page
    And I scroll 900 pixels on the Home page

    Then I check the token with name Kolibri is NOT displayed on the Home page


@manage_assets
  Scenario: Validation check on Add Asset page + other checks [Negative]
    Given I have imported an existing account

    And I press Manage Dropdown Button on the Assets page
    And I press Manage Button on the Assets (Manage Dropdown) page
#   empty state check
    And I am on the ManageAssetsTokens page
    And I enter shortRandomContent into Search Assets Input on the Manage Assets page
    And The Empty State Text is displayed on the Manage Assets page

    And I clear Search Assets Input value on the Manage Assets page
    And I press Add Asset Button on the Manage Assets(Tokens) page

#  validation checks
    And I am on the AddAsset page
    # Address input
    And I enter shortRandomContent into Address Input on the Add Asset page
    And I got the validation-error 'Invalid address' in the Address Input Section on the Add Asset page
    And I clear Address Input value on the Add Asset page
    And I got the validation-error 'Required' in the Address Input Section on the Add Asset page

    And I enter customTokenContractAddress into Address Input on the Add Asset page
    And I wait until adding asset customTokenName is preloaded
    And I scroll 150 pixels on the AddAsset page

    # Failed parse metadata alert
    And I enter amount_1 into Asset ID Input on the Add Asset page
    And I got the 'Failed to parse metadata' warning with Alert title Text element on the Alert page
    And I clear Asset ID Input value on the Add Asset page
    And I wait until adding asset customTokenName is preloaded

    # Symbol input.
    And I clear Symbol Input value on the Add Asset page
    And I got the validation-error 'Required' in the Symbol Input Section on the Add Asset page
    And I enter longRandomContent into Symbol Input on the Add Asset page
    And I got the validation-error 'Only a-z, A-Z, 0-9 chars allowed, 2-10 length' in the Symbol Input Section on the Add Asset page
    And I clear Symbol Input value on the Add Asset page
    And I enter сyrillicContent into Symbol Input on the Add Asset page
    And I got the validation-error 'Only a-z, A-Z, 0-9 chars allowed, 2-10 length' in the Symbol Input Section on the Add Asset page
    And I clear Symbol Input value on the Add Asset page

    And I enter customTokenSymbol into Symbol Input on the Add Asset page
    And I scroll 100 pixels on the AddAsset page

    # Name input.
    And I clear Name Input value on the Add Asset page
    And I got the validation-error 'Required' in the Name Input Section on the Add Asset page
    And I enter amount_1 into Name Input on the Add Asset page
    And I got the validation-error 'No special characters, 3-25 length' in the Name Input Section on the Add Asset page

    And I enter longRandomContent into Name Input on the Add Asset page
    And I got the validation-error 'No special characters, 3-25 length' in the Name Input Section on the Add Asset page
    And I clear Name Input value on the Add Asset page

    And I enter specialSymbolsContent into Name Input on the Add Asset page
    And I got the validation-error 'No special characters, 3-25 length' in the Name Input Section on the Add Asset page
    And I clear Name Input value on the Add Asset page

    And I enter customTokenName into Name Input on the Add Asset page

    # Decimals input (check if the input has right decimals)
    And I scroll 100 pixels on the AddAsset page
    And The Decimals Input on the Add Asset page has correct 8 value

    # Icon URL
    And I scroll 500 pixels on the AddAsset page
    And I clear Icon URL Input value on the Add Asset page
    And I enter shortRandomContent into Icon URL Input on the Add Asset page
    And I scroll 500 pixels on the AddAsset page
    And I got the validation-error 'Valid image URLOnly HTTPSOnly .png, .jpg, .jpeg, .gif, .webp images allowedOr IPFS image URL' in the Icon URL Input Section on the Add Asset page

    And I clear Icon URL Input value on the Add Asset page
    And I enter customTokenIconURL into Icon URL Input on the Add Asset page

    # checking if token will be added after validation errors
    And I press Add Asset Button on the Add Asset page

    And I am on the Token page
    And I check that customTokenSymbol page with customTokenName token displayed or selected correctly
    And I press Temple Logo Icon on the Header page

    And I am on the Home page
    And I scroll 900 pixels on the Home page

    Then I check the token with name Killer is displayed on the Home page





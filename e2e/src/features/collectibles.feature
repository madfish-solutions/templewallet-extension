Feature: Check functional on the Collectible page

  @collectibles
  Scenario: As a user, i'd like to check functional on the 'Collectible' page
    Given I have imported an existing account

    And I press Collectibles Tab on the Home page
    And I am on the CollectiblesTabPage page

  #  empty state error
    And I enter shortRandomContent into Search Assets Input (Collectibles) on the Assets page
    And The Empty State Text on the Collectibles page has correct You don’t have collectibles yet!Good time to get one of them value
    And I clear Search Assets Input (Collectibles) value on the Assets page

  #  show info checkbox
    And I press Manage Dropdown Button on the Assets page
    And I press Show Info Checkbox on the Assets (Manage Dropdown) page
    And I press Floor Price Title on the Collectibles page

  #  check that correct collectible is opened
    And I press Back Button on the Page Layout page
    And I check the collectible with name TEZ is displayed on the CollectiblesTab page
    And I click on The perfect NFT! collectible to redirect on details page
    And I am on the CollectiblePage page
    And I check that CollectiblePage page with The perfect NFT! collectible displayed correctly



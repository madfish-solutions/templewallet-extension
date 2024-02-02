Feature: Check functional on the Collectible page

  @collectibles
  Scenario: As a user, i'd like to check functional on the 'Collectible' page
    Given I have imported an existing account

    And I press Collectibles Tab on the Home page

  #  empty state error
    And I enter shortRandomContent into Search Assets Input (Collectibles) on the Assets page
    And The Empty State Text on the Collectibles page has correct You don’t have collectibles yet!Good time to get one of them value
    And I clear Search Assets Input (Collectibles) value on the Assets page

  #  Show info checkbox
    And I press Manage Dropdown Button on the Assets page
    And I press Show Info Checkbox on the Assets (Manage Dropdown) page
    And I press Floor Price on the Colletibles page

Feature: Basic action lifecycle

  Background:
    Given a 4-player game in "MINION" phase with rules enforced

  Scenario: A vampire bleeds their prey
    Given "Alice" controls a ready vampire "Dima" with 3 blood and capacity 5
    And "Bob"'s pool is 30
    When "Alice" declares a BLEED action targeting "Bob"
    And all players pass the impulse window
    And "Alice" resolves the action
    Then "Bob"'s pool should decrease by 1
    And "Alice" should hold the Edge
    And no rule violation should occur

  Scenario: A hunt restores 1 blood up to capacity
    Given "Alice" controls a ready vampire "Dima" with 2 blood and capacity 5
    When "Alice" declares a HUNT action
    And all players pass the impulse window
    And "Alice" resolves the action
    Then "Dima" should have 3 blood
    And no rule violation should occur

  Scenario: Hunt does not exceed capacity
    Given "Alice" controls a ready vampire "Dima" with 5 blood and capacity 5
    When "Alice" declares a HUNT action
    And all players pass the impulse window
    And "Alice" resolves the action
    Then "Dima" should have 5 blood

  Scenario: A blocked action sets status to BLOCKED
    Given "Alice" controls a ready vampire "Dima" with 3 blood and capacity 5
    And "Bob" controls a ready vampire "Meridian" with 3 blood and capacity 5
    When "Alice" declares a BLEED action
    And "Alice" passes the impulse
    And "Bob" attempts to block with "Meridian"
    Then the action status should be "BLOCKED"
    And no rule violation should occur

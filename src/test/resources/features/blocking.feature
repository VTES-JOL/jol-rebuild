Feature: Block eligibility

  Background:
    Given a 4-player game in "MINION" phase with rules enforced
    And "Alice" controls a ready vampire "Dima" with 3 blood and capacity 5
    And "Bob" controls a ready vampire "Meridian" with 3 blood and capacity 5

  Scenario: Only the current impulse holder may block
    When "Alice" declares a BLEED action
    And "Bob" cannot block before receiving the impulse
    Then a rule violation should occur

  Scenario: Bob can block after receiving the impulse
    When "Alice" declares a BLEED action
    And "Alice" passes the impulse
    And "Bob" attempts to block with "Meridian"
    Then the action status should be "BLOCKED"
    And no rule violation should occur

  Scenario: Only the target player may block a directed action
    Given "Carol" controls a ready vampire "Camille" with 3 blood and capacity 5
    When "Alice" declares a BLEED action targeting "Bob"
    And "Alice" passes the impulse
    And "Bob" passes the impulse
    And "Carol" attempts to block with "Camille"
    Then a rule violation should occur

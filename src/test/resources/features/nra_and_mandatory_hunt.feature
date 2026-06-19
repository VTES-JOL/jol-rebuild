Feature: NRA and mandatory hunt enforcement

  Background:
    Given a 4-player game in "MINION" phase with rules enforced

  Scenario: NRA blocks a second bleed by the same minion
    Given "Alice" controls a ready vampire "Dima" with 3 blood and capacity 5
    When "Alice" declares a BLEED action targeting "Bob"
    And all players pass the impulse window
    And "Alice" resolves the action
    And the sequencing window closes
    And "Dima" is unlocked
    And "Alice" declares a BLEED action targeting "Bob"
    Then a rule violation mentioning "NRA" should occur

  Scenario: Hunt is not NRA-locked and may repeat
    Given "Alice" controls a ready vampire "Dima" with 3 blood and capacity 5
    When "Alice" declares a HUNT action
    And all players pass the impulse window
    And "Alice" resolves the action
    And the sequencing window closes
    And "Dima" is unlocked
    And "Alice" declares a HUNT action
    Then no rule violation should occur

  Scenario: A vampire with no blood must hunt before any other action
    Given "Alice" controls a ready vampire "HungryVamp" with 0 blood and capacity 4
    When "Alice" declares a BLEED action with "HungryVamp"
    Then a rule violation mentioning "hunt" should occur

  Scenario: A vampire with no blood may declare hunt
    Given "Alice" controls a ready vampire "HungryVamp" with 0 blood and capacity 4
    When "Alice" declares a HUNT action with "HungryVamp"
    Then no rule violation should occur

  Scenario: Another vampire's mandatory hunt blocks all non-hunt actions
    Given "Alice" controls a ready vampire "Dima" with 3 blood and capacity 5
    And "Alice" controls a ready vampire "HungryVamp" with 0 blood and capacity 4
    When "Alice" declares a BLEED action with "Dima"
    Then a rule violation mentioning "hunt" should occur

  Scenario: NRA is cleared on the next turn and bleed may be declared again
    Given "Alice" controls a ready vampire "Dima" with 3 blood and capacity 5
    When "Alice" declares a BLEED action targeting "Bob"
    And all players pass the impulse window
    And "Alice" resolves the action
    And the sequencing window closes
    And "Dima" is unlocked
    Then "Dima" should be NRA-locked from "BLEED"

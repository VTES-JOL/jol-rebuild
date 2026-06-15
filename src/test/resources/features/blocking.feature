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
    And "Alice" passes sequencing
    And "Bob" passes sequencing
    Then the action status should be "BLOCKED"
    And no rule violation should occur

  Scenario: Only the target player may block a directed action
    Given "Carol" controls a ready vampire "Camille" with 3 blood and capacity 5
    When "Alice" declares a BLEED action targeting "Bob"
    And "Alice" passes the impulse
    And "Bob" passes the impulse
    And "Carol" attempts to block with "Camille"
    Then a rule violation should occur

  Scenario: Block fails when actor stealth exceeds blocker intercept
    When "Alice" declares a BLEED action
    And "Alice" passes the impulse
    And "Bob" attempts to block with "Meridian"
    And "Alice" adds 1 stealth
    And "Alice" passes sequencing
    And "Bob" passes sequencing
    Then the action status should be "DURING_ACTION"
    And no rule violation should occur

  Scenario: Block succeeds when blocker intercept meets actor stealth
    When "Alice" declares a BLEED action
    And "Alice" passes the impulse
    And "Bob" attempts to block with "Meridian"
    And "Alice" adds 1 stealth
    And "Bob" adds 1 intercept to "Meridian"
    And "Alice" passes sequencing
    And "Bob" passes sequencing
    Then the action status should be "BLOCKED"
    And no rule violation should occur

  Scenario: AddIntercept rejected when blocker already has sufficient intercept
    When "Alice" declares a BLEED action
    And "Alice" passes the impulse
    And "Bob" attempts to block with "Meridian"
    And "Bob" adds 1 intercept to "Meridian"
    And "Bob" adds 1 more intercept to "Meridian" expecting failure
    Then a rule violation should occur

  Scenario: AddStealth rejected when not in an active block attempt
    When "Alice" declares a BLEED action
    And "Alice" adds stealth outside a block attempt expecting failure
    Then a rule violation should occur

  Scenario: Blocks declined window opens after all players pass
    When "Alice" declares a BLEED action
    And all players pass the block window
    Then the action status should be "DURING_ACTION"
    And blocks should be declined
    And no rule violation should occur

  Scenario: AttemptBlock rejected in blocks-declined window
    When "Alice" declares a BLEED action
    And all players pass the block window
    And "Bob" attempts to block with "Meridian"
    Then a rule violation should occur

  Scenario: RedirectAction reopens block window
    Given "Carol" controls a ready vampire "Camille" with 3 blood and capacity 5
    When "Alice" declares a BLEED action targeting "Bob"
    And all players pass the block window
    And "Alice" redirects the action to "Carol"
    Then blocks should not be declined
    And no rule violation should occur

  Scenario: Wake grants locked minion block permission
    Given "Bob" has a locked vampire "Nightshade" with 3 blood and capacity 5
    When "Alice" declares a BLEED action
    And "Bob" grants wake to "Nightshade"
    And "Alice" passes the impulse
    And "Bob" attempts to block with "Nightshade"
    And "Alice" passes sequencing
    And "Bob" passes sequencing
    Then the action status should be "BLOCKED"
    And no rule violation should occur

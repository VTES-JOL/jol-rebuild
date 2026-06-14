package net.deckserver.jol.game.effect;

import net.deckserver.jol.enums.RestrictionType;
import net.deckserver.jol.game.command.CardRef;

/**
 * Records that a minion is restricted from a specific action for the duration of the current action.
 * Applied to PendingActionState.actionRestrictions; cleared automatically when the action ends.
 */
public record RestrictionAddedEffect(
        RestrictionType type,
        CardRef targetRef,
        String sourceCardId,
        String reason
) implements GameEffect {}

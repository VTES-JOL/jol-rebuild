package net.deckserver.jol.services;

import jakarta.enterprise.context.ApplicationScoped;
import net.deckserver.jol.game.CardData;
import net.deckserver.jol.game.GameData;

/**
 * Evaluates persistent, in-play eligibility restrictions derived from equipment or other
 * continuously-active cards (e.g. Signet of King Saul). These are checked live at eligibility
 * time rather than recorded as effects, because the restriction exists as long as the card is in play.
 *
 * Each method returns true if the action is permitted, false if restricted.
 * Start with allow-all stubs; populate each method as specific cards are implemented.
 */
@ApplicationScoped
public class PassiveRestrictionChecker {

    /**
     * Returns false if a persistent in-play effect prevents {@code blocker} from blocking
     * actions declared by {@code actor} (e.g. Signet of King Saul: capacity ≥ 8 cannot block).
     */
    public boolean canBlock(CardData blocker, CardData actor, GameData game) {
        return true;
    }

    /**
     * Returns false if a persistent in-play effect prevents {@code combatant} from maneuvering.
     */
    public boolean canManeuver(CardData combatant, GameData game) {
        return true;
    }

    /**
     * Returns false if a persistent in-play effect prevents {@code combatant} from pressing.
     */
    public boolean canPress(CardData combatant, GameData game) {
        return true;
    }

    /**
     * Returns false if a persistent in-play effect prevents {@code combatant} from voting
     * in a referendum.
     */
    public boolean canVote(CardData combatant, GameData game) {
        return true;
    }
}

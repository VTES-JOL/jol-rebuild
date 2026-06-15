package net.deckserver.jol.game.effect;

import net.deckserver.jol.game.CombatState;

/** Combat state was created, updated, or cleared. combatState is null when combat ends. */
public record CombatStateChangedEffect(CombatState combatState) implements GameEffect {
    public CombatStateChangedEffect() { this(null); }
}

package net.deckserver.jol.game.effect;

import net.deckserver.jol.game.ReferendumState;

/** The referendum state was updated or cleared. referendum is null when closed. */
public record ReferendumStateChangedEffect(ReferendumState referendum) implements GameEffect {
    public ReferendumStateChangedEffect() {
        this(null);
    }
}

package net.deckserver.jol.game.effect;

import net.deckserver.jol.game.CardPlayState;

/** The CARD_AS_PLAYED window was opened or closed. cardPlayState is null when active=false. */
public record CardPlayChangedEffect(boolean active, CardPlayState cardPlayState) implements GameEffect {
    public CardPlayChangedEffect(boolean active) {
        this(active, null);
    }
}

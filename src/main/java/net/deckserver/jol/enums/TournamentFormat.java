package net.deckserver.jol.enums;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public enum TournamentFormat {
    SINGLE_DECK("Single Deck"),
    MULTI_DECK("Multi Deck");

    private final String label;

    TournamentFormat(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}

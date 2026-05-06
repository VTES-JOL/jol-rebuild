package net.deckserver.jol.enums;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public enum GameFormat {
    STANDARD("Standard", 5),
    DUEL("Duel", 2),
    V5("V5", 5);

    private final String label;
    private final int maxPlayers;

    GameFormat(String label, int maxPlayers) {
        this.label = label;
        this.maxPlayers = maxPlayers;
    }

    public String getLabel() {
        return label;
    }

    public int getMaxPlayers() {
        return maxPlayers;
    }
}

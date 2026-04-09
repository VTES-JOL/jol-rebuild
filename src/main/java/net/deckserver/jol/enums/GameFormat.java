package net.deckserver.jol.enums;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public enum GameFormat {
    STANDARD("Standard"),
    DUEL("Duel"),
    V5("V5");
    private final String label;

    GameFormat(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}

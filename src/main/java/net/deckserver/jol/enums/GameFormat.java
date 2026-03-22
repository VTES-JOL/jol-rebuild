package net.deckserver.jol.enums;

public enum GameFormat {
    STANDARD("Standard"),
    DUEL("Duel"),
    V5("V5"),
    PLAYTEST("Playtest");

    private final String label;

    private GameFormat(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}

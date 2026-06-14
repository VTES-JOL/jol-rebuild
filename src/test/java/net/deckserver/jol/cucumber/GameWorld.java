package net.deckserver.jol.cucumber;

import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.command.CardRef;

import java.util.LinkedHashMap;
import java.util.Map;

/** Shared scenario state injected by PicoContainer into every step definition class. */
public class GameWorld {
    public GameData game;
    public String gameId;
    public Exception lastException;
    /** Maps minion name → CardRef so steps can address vampires by label. */
    public final Map<String, CardRef> minionRefs = new LinkedHashMap<>();
    /** Snapshot of a player's pool before the current When step, for "decrease by" assertions. */
    public final Map<String, Integer> poolBefore = new LinkedHashMap<>();
}

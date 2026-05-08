package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

/** Oust a player: marks them ousted, awards 1 VP to their predator, and updates the predator ring. */
@RegisterForReflection
public record OustPlayer(String gameId, String playerName) implements GameCommand {}

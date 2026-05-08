package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

/** Move blood from the player's pool to an uncontrolled vampire during the influence phase. */
@RegisterForReflection
public record InfluenceVampire(String gameId, String cardId, int amount) implements GameCommand {}

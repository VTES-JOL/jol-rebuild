package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

/** Transfer blood between a player's pool and a card (positive = pool→card, negative = card→pool). */
@RegisterForReflection
public record TransferPool(String gameId, String playerName, CardRef ref, int amount) implements GameCommand {}

package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record SetCardNotes(String gameId, String cardId, String notes) implements GameCommand {}

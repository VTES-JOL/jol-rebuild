package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record SetTitle(String gameId, String cardId, String title) implements GameCommand {}

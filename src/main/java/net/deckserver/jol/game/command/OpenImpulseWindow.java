package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.enums.ImpulseContext;

@RegisterForReflection
public record OpenImpulseWindow(String gameId, ImpulseContext context, String actingPlayer, String targetPlayerName) implements GameCommand {}

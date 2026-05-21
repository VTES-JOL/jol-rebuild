package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record CommandContext(
        String turn,
        String phase,
        String currentPlayer,
        CommandLogData command
) {}

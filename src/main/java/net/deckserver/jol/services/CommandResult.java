package net.deckserver.jol.services;

import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.command.CommandLogData;
import net.deckserver.jol.game.effect.GameEffect;

import java.util.List;

public record CommandResult(GameData game, String logMessage, CommandLogData commandLog, List<GameEffect> effects) {

    /** Convenience constructor for handlers that do not yet produce effects. */
    public CommandResult(GameData game, String logMessage, CommandLogData commandLog) {
        this(game, logMessage, commandLog, List.of());
    }

    public static CommandResult silent(GameData game) {
        return new CommandResult(game, null, null, List.of());
    }
}

package net.deckserver.jol.services;

import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.command.CommandLogData;

public record CommandResult(GameData game, String logMessage, CommandLogData commandLog) {
    public static CommandResult silent(GameData game) {
        return new CommandResult(game, null, null);
    }
}

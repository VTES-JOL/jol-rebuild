package net.deckserver.jol.services;

import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.command.CommandLogData;
import net.deckserver.jol.game.effect.GameEffect;

import java.util.List;

/**
 * Result of executing a GameCommand.
 * logMessage — describes command intent ("Alice declared Hunt with Minion X").
 * effectLogMessages — describes each state change produced ("Minion X is now locked").
 */
public record CommandResult(GameData game, String logMessage, CommandLogData commandLog,
                             List<GameEffect> effects, List<String> effectLogMessages) {

    /** Convenience constructor for handlers — effectLogMessages are populated by GameCommandService. */
    public CommandResult(GameData game, String logMessage, CommandLogData commandLog, List<GameEffect> effects) {
        this(game, logMessage, commandLog, effects, List.of());
    }

    /** Convenience constructor for handlers that do not produce effects. */
    public CommandResult(GameData game, String logMessage, CommandLogData commandLog) {
        this(game, logMessage, commandLog, List.of(), List.of());
    }

    public static CommandResult silent(GameData game) {
        return new CommandResult(game, null, null, List.of(), List.of());
    }
}

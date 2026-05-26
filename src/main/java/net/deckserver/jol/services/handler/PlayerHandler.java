package net.deckserver.jol.services.handler;

import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.PlayerData;
import net.deckserver.jol.game.command.*;
import net.deckserver.jol.services.CommandResult;
import net.deckserver.jol.services.GameRules;

public final class PlayerHandler {
    private PlayerHandler() {}

    public static CommandResult handleOustPlayer(GameData game, OustPlayer cmd, String actor) {
        PlayerData ousted = GameRules.requirePlayer(game, cmd.playerName());
        ousted.setPool(0);

        PlayerData predator = ousted.getPredator();
        if (predator != null) {
            predator.addVictoryPoints(1.0f);
            predator.setPool(predator.getPool() + 6);
        }

        game.updatePredatorMapping();

        if (cmd.playerName().equals(game.getCurrentPlayerName())) {
            TurnPhaseHandler.handleNextTurn(game, new NextTurn(cmd.gameId()), actor);
        }

        String msg = actor + " ousted " + cmd.playerName();
        return new CommandResult(game, msg, new CommandLogData.OustPlayerLog(actor, cmd.playerName()));
    }

    public static CommandResult handleSetChoice(GameData game, SetChoice cmd) {
        PlayerData player = GameRules.requirePlayer(game, cmd.playerName());
        player.setChoice(cmd.choice());
        return CommandResult.silent(game);
    }

    public static CommandResult handleReverseOrder(GameData game, ReverseOrder cmd, String actor) {
        game.setOrderOfPlayReversed(!game.isOrderOfPlayReversed());
        String msg = actor + " reversed the order of play";
        return new CommandResult(game, msg, new CommandLogData.ReverseOrderLog(actor));
    }

    public static CommandResult handleSetGameNotes(GameData game, SetGameNotes cmd) {
        game.setNotes(cmd.notes());
        return CommandResult.silent(game);
    }
}

package net.deckserver.jol.services.handler;

import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.PlayerData;
import net.deckserver.jol.game.command.*;
import net.deckserver.jol.game.effect.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import net.deckserver.jol.services.CommandResult;
import net.deckserver.jol.services.GameRules;

public final class PlayerHandler {
    private PlayerHandler() {}

    public static CommandResult handleOustPlayer(GameData game, OustPlayer cmd, String actor) {
        PlayerData ousted = GameRules.requirePlayer(game, cmd.playerName());

        List<GameEffect> effects = new ArrayList<>();
        effects.add(new PlayerPoolChangedEffect(cmd.playerName(), -ousted.getPool()));
        effects.add(new PlayerOustedEffect(cmd.playerName()));

        PlayerData predator = ousted.getPredator();
        if (predator != null) {
            effects.add(new PlayerVictoryPointsChangedEffect(predator.getName(), 1.0f));
            effects.add(new PlayerPoolChangedEffect(predator.getName(), 6));
        }

        // Compute next-turn effects before state is mutated, skipping the ousted player
        String turnMsg = "";
        if (cmd.playerName().equals(game.getCurrentPlayerName())) {
            List<GameEffect> turnEffects = TurnPhaseHandler.computeNextTurnEffects(
                    game, cmd.gameId(), Set.of(cmd.playerName()), actor);
            if (!turnEffects.isEmpty()) {
                TurnChangedEffect te = (TurnChangedEffect) turnEffects.getFirst();
                turnMsg = "; turn " + te.turn() + " — " + te.currentPlayerName() + " begins";
            }
            effects.addAll(turnEffects);
        }

        // Check game completion: count active players minus the one being ousted
        long survivors = game.getCurrentPlayers().stream()
                .filter(p -> !p.getName().equals(cmd.playerName()))
                .count();
        if (survivors == 1) {
            String lastPlayer = game.getCurrentPlayers().stream()
                    .filter(p -> !p.getName().equals(cmd.playerName()))
                    .findFirst().map(PlayerData::getName).orElse(null);
            if (lastPlayer != null) {
                effects.add(new PlayerVictoryPointsChangedEffect(lastPlayer, 1.0f));
            }
            effects.add(new GameCompletedEffect());
        }

        String msg = actor + " ousted " + cmd.playerName() + turnMsg;
        return new CommandResult(game, msg, new CommandLogData.OustPlayerLog(actor, cmd.playerName()), effects);
    }

    public static CommandResult handleSetChoice(GameData game, SetChoice cmd) {
        PlayerData player = GameRules.requirePlayer(game, cmd.playerName());
        player.setChoice(cmd.choice());
        return CommandResult.silent(game);
    }

    public static CommandResult handleReverseOrder(GameData game, ReverseOrder cmd, String actor) {
        boolean newState = !game.isOrderOfPlayReversed();
        String msg = actor + " reversed the order of play";
        return new CommandResult(game, msg, new CommandLogData.ReverseOrderLog(actor),
                List.of(new OrderOfPlayReversedEffect(newState)));
    }

    public static CommandResult handleSetGameNotes(GameData game, SetGameNotes cmd) {
        return new CommandResult(game, null, null,
                List.of(new GameNotesChangedEffect(cmd.notes())));
    }
}

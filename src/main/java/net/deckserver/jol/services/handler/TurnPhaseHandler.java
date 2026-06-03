package net.deckserver.jol.services.handler;

import net.deckserver.jol.enums.ImpulseContext;
import net.deckserver.jol.enums.Phase;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.ImpulseState;
import net.deckserver.jol.game.PlayerData;
import net.deckserver.jol.game.command.AdvancePhase;
import net.deckserver.jol.game.command.CommandLogData;
import net.deckserver.jol.game.command.NextTurn;
import net.deckserver.jol.services.CommandResult;

import java.util.List;

public final class TurnPhaseHandler {
    private TurnPhaseHandler() {}

    public static CommandResult handleAdvancePhase(GameData game, AdvancePhase cmd, String actor) {
        Phase[] phases = Phase.values();
        int current = game.getPhase() != null ? game.getPhase().ordinal() : 0;
        int next = (current + 1) % phases.length;
        if (next == 0) {
            return handleNextTurn(game, new NextTurn(cmd.gameId()), actor);
        }
        game.setPhase(phases[next]);
        if (phases[next] == Phase.INFLUENCE) {
            game.setTransfersRemaining(computeTransferBudget(game));
        }
        openAutoImpulse(game, game.getCurrentPlayerName());
        String msg = actor + " advanced to " + phases[next].getDescription() + " phase";
        return new CommandResult(game, msg, new CommandLogData.AdvancePhaseLog(actor, phases[next]));
    }

    public static CommandResult handleNextTurn(GameData game, NextTurn cmd, String actor) {
        List<String> order = game.getPlayerOrder();
        String currentName = game.getCurrentPlayerName();
        int currentIndex = currentName != null ? order.indexOf(currentName) : -1;

        int size = order.size();
        int nextIndex = currentIndex;
        for (int i = 1; i <= size; i++) {
            nextIndex = (currentIndex + i) % size;
            PlayerData candidate = game.getPlayer(order.get(nextIndex));
            if (candidate != null && !candidate.isOusted()) break;
        }

        String[] parts = game.getTurn() != null ? game.getTurn().split("\\.") : new String[]{"1", "0"};
        int major = Integer.parseInt(parts[0]);
        int minor = parts.length > 1 ? Integer.parseInt(parts[1]) : 0;
        minor++;
        if (minor > size) {
            major++;
            minor = 1;
        }
        game.setTurn(major + "." + minor);

        PlayerData nextPlayer = game.getPlayer(order.get(nextIndex));
        if (nextPlayer == null || nextPlayer.isOusted()) {
            // All players are ousted — game completion is handled by the caller.
            return CommandResult.silent(game);
        }
        game.setCurrentPlayer(nextPlayer);
        game.setPhase(Phase.UNLOCK);
        game.setTransfersRemaining(0);

        if (nextPlayer != null) {
            HandlerUtils.unlockPlayerCards(game, nextPlayer.getName());
        }

        String nextPlayerName = nextPlayer != null ? nextPlayer.getName() : "unknown";
        openAutoImpulse(game, nextPlayerName);
        String turn = major + "." + minor;
        String msg = "Turn " + turn + " — " + nextPlayerName + " begins their turn";
        return new CommandResult(game, msg, new CommandLogData.NextTurnLog(actor, turn, nextPlayerName));
    }

    static void openAutoImpulse(GameData game, String actingPlayer) {
        ImpulseState state = new ImpulseState();
        state.setActive(true);
        state.setContext(ImpulseContext.UNDIRECTED);
        state.setActingPlayer(actingPlayer);
        state.setCurrentImpulseHolder(actingPlayer);
        state.setConsecutivePasses(0);
        state.setPassOrder(HandlerUtils.buildPassOrder(game, ImpulseContext.UNDIRECTED, actingPlayer, null));
        game.setImpulseWindow(state);
    }

    private static int computeTransferBudget(GameData game) {
        String[] parts = game.getTurn().split("\\.");
        int major = Integer.parseInt(parts[0]);
        if (major >= 2) return 4;
        int minor = parts.length > 1 ? Integer.parseInt(parts[1]) : 1;
        return Math.min(minor, 4);
    }
}

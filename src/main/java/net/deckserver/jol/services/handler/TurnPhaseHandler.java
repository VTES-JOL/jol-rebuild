package net.deckserver.jol.services.handler;

import net.deckserver.jol.enums.ImpulseContext;
import net.deckserver.jol.enums.Phase;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.ImpulseState;
import net.deckserver.jol.game.PlayerData;
import net.deckserver.jol.game.command.AdvancePhase;
import net.deckserver.jol.game.command.CommandLogData;
import net.deckserver.jol.game.command.NextTurn;
import net.deckserver.jol.game.effect.*;
import net.deckserver.jol.services.CommandResult;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

public final class TurnPhaseHandler {
    private TurnPhaseHandler() {}

    public static CommandResult handleAdvancePhase(GameData game, AdvancePhase cmd, String actor) {
        Phase[] phases = Phase.values();
        int current = game.getPhase() != null ? game.getPhase().ordinal() : 0;
        int next = (current + 1) % phases.length;
        if (next == 0) {
            List<GameEffect> effects = computeNextTurnEffects(game, cmd.gameId(), Set.of(), actor);
            String msg = "Turn advanced past " + phases[current].getDescription();
            return new CommandResult(game, msg, new CommandLogData.AdvancePhaseLog(actor, phases[0]), effects);
        }
        Phase nextPhase = phases[next];
        List<GameEffect> effects = new ArrayList<>();
        effects.add(new PhaseChangedEffect(nextPhase.name()));
        String currentPlayerName = game.getCurrentPlayerName();
        if (currentPlayerName != null) {
            effects.add(buildAutoImpulseEffect(game, currentPlayerName));
        }
        String msg = actor + " advanced to " + nextPhase.getDescription() + " phase";
        return new CommandResult(game, msg, new CommandLogData.AdvancePhaseLog(actor, nextPhase), effects);
    }

    public static CommandResult handleNextTurn(GameData game, NextTurn cmd, String actor) {
        List<GameEffect> effects = computeNextTurnEffects(game, cmd.gameId(), Set.of(), actor);
        if (effects.isEmpty()) return CommandResult.silent(game);
        TurnChangedEffect turnEffect = (TurnChangedEffect) effects.getFirst();
        String msg = "Turn " + turnEffect.turn() + " — " + turnEffect.currentPlayerName() + " begins their turn";
        return new CommandResult(game, msg,
                new CommandLogData.NextTurnLog(actor, turnEffect.turn(), turnEffect.currentPlayerName()),
                effects);
    }

    /** Computes next-turn effects without mutating game state. skipPlayers is excluded when finding the next player. */
    static List<GameEffect> computeNextTurnEffects(GameData game, String gameId, Set<String> skipPlayers, String actor) {
        List<String> order = game.getPlayerOrder();
        String currentName = game.getCurrentPlayerName();
        int currentIndex = currentName != null ? order.indexOf(currentName) : -1;

        int size = order.size();
        int nextIndex = currentIndex;
        for (int i = 1; i <= size; i++) {
            nextIndex = (currentIndex + i) % size;
            String candidateName = order.get(nextIndex);
            PlayerData candidate = game.getPlayer(candidateName);
            if (candidate != null && !candidate.isOusted() && !skipPlayers.contains(candidateName)) break;
        }

        String[] parts = game.getTurn() != null ? game.getTurn().split("\\.") : new String[]{"1", "0"};
        int major = Integer.parseInt(parts[0]);
        int minor = parts.length > 1 ? Integer.parseInt(parts[1]) : 0;
        minor++;
        if (minor > size) { major++; minor = 1; }
        String turn = major + "." + minor;

        PlayerData nextPlayer = game.getPlayer(order.get(nextIndex));
        if (nextPlayer == null || nextPlayer.isOusted() || skipPlayers.contains(nextPlayer.getName())) {
            return List.of();
        }

        List<GameEffect> effects = new ArrayList<>();
        effects.add(new TurnChangedEffect(turn, nextPlayer.getName()));
        effects.add(new PhaseChangedEffect(Phase.UNLOCK.name()));
        effects.addAll(HandlerUtils.buildUnlockEffects(nextPlayer));
        effects.add(buildAutoImpulseEffect(game, nextPlayer.getName()));
        return effects;
    }

    static ImpulseWindowChangedEffect buildAutoImpulseEffect(GameData game, String actingPlayer) {
        ImpulseState state = new ImpulseState();
        state.setActive(true);
        state.setContext(ImpulseContext.UNDIRECTED);
        state.setActingPlayer(actingPlayer);
        state.setCurrentImpulseHolder(actingPlayer);
        state.setConsecutivePasses(0);
        state.setPassOrder(HandlerUtils.buildPassOrder(game, ImpulseContext.UNDIRECTED, actingPlayer, null));
        return new ImpulseWindowChangedEffect(true, state);
    }
}

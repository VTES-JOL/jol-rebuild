package net.deckserver.jol.services.handler;

import net.deckserver.jol.enums.ImpulseContext;
import net.deckserver.jol.exception.GameRuleException;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.ImpulseState;
import net.deckserver.jol.game.command.*;
import net.deckserver.jol.services.CommandResult;

import java.util.List;

public final class ImpulseHandler {
    private ImpulseHandler() {}

    public static CommandResult handleOpenImpulseWindow(GameData game, OpenImpulseWindow cmd, String actor) {
        ImpulseState state = new ImpulseState();
        state.setActive(true);
        state.setContext(cmd.context());
        state.setActingPlayer(cmd.actingPlayer());
        state.setCurrentImpulseHolder(cmd.actingPlayer());
        state.setConsecutivePasses(0);
        state.setPassOrder(HandlerUtils.buildPassOrder(game, cmd.context(), cmd.actingPlayer(), cmd.targetPlayerName()));
        game.setImpulseWindow(state);
        String contextLabel = cmd.context().name().toLowerCase().replace('_', ' ');
        String msg = actor + " opened an impulse window (" + contextLabel + ") — " + cmd.actingPlayer() + " has first impulse";
        return new CommandResult(game, msg, new CommandLogData.OpenImpulseLog(actor, cmd.context().name(), cmd.actingPlayer()));
    }

    public static CommandResult handlePassImpulse(GameData game, PassImpulse cmd, String actor) {
        ImpulseState state = game.getImpulseWindow();
        if (state == null || !state.isActive()) return CommandResult.silent(game);
        if (!cmd.playerName().equals(state.getCurrentImpulseHolder())) {
            throw new GameRuleException("It is not your impulse to pass");
        }

        int passes = state.getConsecutivePasses() + 1;
        state.setConsecutivePasses(passes);

        if (passes >= state.getPassOrder().size()) {
            state.setActive(false);
            String msg = actor + " passed — all players have passed; impulse window closes";
            return new CommandResult(game, msg, new CommandLogData.PassImpulseLog(actor));
        }

        List<String> order = state.getPassOrder();
        int idx = order.indexOf(state.getCurrentImpulseHolder());
        state.setCurrentImpulseHolder(order.get((idx + 1) % order.size()));
        String msg = actor + " passed impulse to " + state.getCurrentImpulseHolder();
        return new CommandResult(game, msg, new CommandLogData.PassImpulseLog(actor));
    }

    public static CommandResult handleClaimImpulse(GameData game, ClaimImpulse cmd, String actor) {
        ImpulseState state = game.getImpulseWindow();
        if (state == null || !state.isActive()) return CommandResult.silent(game);
        if (!cmd.playerName().equals(state.getCurrentImpulseHolder())) {
            throw new GameRuleException("It is not your impulse to claim");
        }
        state.setConsecutivePasses(0);
        state.setCurrentImpulseHolder(state.getActingPlayer());
        String msg = actor + " used their impulse — impulse returns to " + state.getActingPlayer();
        return new CommandResult(game, msg, new CommandLogData.ClaimImpulseLog(actor));
    }

    public static CommandResult handleCloseImpulseWindow(GameData game, CloseImpulseWindow cmd, String actor) {
        ImpulseState state = game.getImpulseWindow();
        if (state != null) state.setActive(false);
        game.setImpulseWindow(null);
        String msg = actor + " closed the impulse window";
        return new CommandResult(game, msg, new CommandLogData.CloseImpulseLog(actor));
    }
}

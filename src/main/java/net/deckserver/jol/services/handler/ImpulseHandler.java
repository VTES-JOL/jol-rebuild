package net.deckserver.jol.services.handler;

import net.deckserver.jol.enums.ActionStatus;
import net.deckserver.jol.enums.ImpulseContext;
import net.deckserver.jol.exception.GameRuleException;
import net.deckserver.jol.game.*;
import net.deckserver.jol.game.command.*;
import net.deckserver.jol.game.effect.ImpulseWindowChangedEffect;
import net.deckserver.jol.game.effect.PendingActionChangedEffect;
import net.deckserver.jol.services.CommandResult;

import java.util.List;

public final class ImpulseHandler {
    private ImpulseHandler() {}

    public static CommandResult handleOpenImpulseWindow(GameData game, OpenImpulseWindow cmd, String actor) {
        ImpulseState state = ImpulseEngine.open(game, cmd.context(), cmd.actingPlayer(), cmd.targetPlayerName());
        String contextLabel = cmd.context().name().toLowerCase().replace('_', ' ');
        String msg = actor + " opened an impulse window (" + contextLabel + ") — " + cmd.actingPlayer() + " has first impulse";
        return new CommandResult(game, msg,
                new CommandLogData.OpenImpulseLog(actor, cmd.context().name(), cmd.actingPlayer()),
                List.of(new ImpulseWindowChangedEffect(true, state)));
    }

    public static CommandResult handlePassImpulse(GameData game, PassImpulse cmd, String actor) {
        ImpulseState current = game.getImpulseWindow();
        if (current == null || !current.isActive()) return CommandResult.silent(game);
        if (!cmd.playerName().equals(current.getCurrentImpulseHolder())) {
            throw new GameRuleException("It is not your impulse to pass");
        }

        ImpulseState updated = ImpulseEngine.pass(current);
        if (updated == null) {
            if (current.getContext() == ImpulseContext.COMBAT && game.getCombatState() != null) {
                java.util.List<net.deckserver.jol.game.effect.GameEffect> effects = new java.util.ArrayList<>();
                effects.add(new ImpulseWindowChangedEffect(false));
                effects.addAll(CombatHandler.advanceCombatStepAfterImpulse(game));
                return new CommandResult(game, actor + " passed — advancing combat step",
                        new CommandLogData.PassImpulseLog(actor), effects);
            }
            PendingActionState pending = game.getPendingAction();
            if (pending != null && pending.getStatus() == ActionStatus.DURING_ACTION
                    && pending.getCurrentBlockerRef() == null) {
                if (!pending.isBlocksDeclined()) {
                    // All players passed the block window — open blocks-declined window
                    PendingActionState withDeclined = new PendingActionState(pending);
                    withDeclined.setBlocksDeclined(true);
                    String actingPlayer = pending.getActorRef().playerName();
                    ImpulseState declinedWindow = ImpulseEngine.open(game, ImpulseContext.UNDIRECTED, actingPlayer, null);
                    String msg = actor + " passed — blocks declined; acting player has priority before resolution";
                    return new CommandResult(game, msg, new CommandLogData.PassImpulseLog(actor),
                            List.of(new PendingActionChangedEffect(true, withDeclined),
                                    new ImpulseWindowChangedEffect(true, declinedWindow)));
                } else {
                    // All players passed the blocks-declined window — close; ResolveAction is now available
                    String msg = actor + " passed — impulse window closes; action may now be resolved";
                    return new CommandResult(game, msg, new CommandLogData.PassImpulseLog(actor),
                            List.of(new ImpulseWindowChangedEffect(false)));
                }
            }
            String closeMsg = actor + " passed — all players have passed; impulse window closes";
            return new CommandResult(game, closeMsg, new CommandLogData.PassImpulseLog(actor),
                    List.of(new ImpulseWindowChangedEffect(false)));
        }

        String msg = actor + " passed impulse to " + updated.getCurrentImpulseHolder();
        return new CommandResult(game, msg, new CommandLogData.PassImpulseLog(actor),
                List.of(new ImpulseWindowChangedEffect(true, updated)));
    }

    public static CommandResult handleClaimImpulse(GameData game, ClaimImpulse cmd, String actor) {
        ImpulseState current = game.getImpulseWindow();
        if (current == null || !current.isActive()) return CommandResult.silent(game);
        if (!cmd.playerName().equals(current.getCurrentImpulseHolder())) {
            throw new GameRuleException("It is not your impulse to claim");
        }
        if (cmd.playerName().equals(current.getActingPlayer())) {
            throw new GameRuleException("You are the acting player — pass or act, do not claim your own impulse");
        }

        ImpulseState updated = ImpulseEngine.claim(current);
        String msg = actor + " used their impulse — impulse returns to " + current.getActingPlayer();
        return new CommandResult(game, msg, new CommandLogData.ClaimImpulseLog(actor),
                List.of(new ImpulseWindowChangedEffect(true, updated)));
    }

    public static CommandResult handleCloseImpulseWindow(GameData game, CloseImpulseWindow cmd, String actor) {
        String msg = actor + " closed the impulse window";
        return new CommandResult(game, msg, new CommandLogData.CloseImpulseLog(actor),
                List.of(new ImpulseWindowChangedEffect(false)));
    }
}

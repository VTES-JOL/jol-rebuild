package net.deckserver.jol.services.handler;

import net.deckserver.jol.enums.ActionStatus;
import net.deckserver.jol.exception.GameRuleException;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.PendingActionState;
import net.deckserver.jol.game.SequencingWindowState;
import net.deckserver.jol.game.command.CloseSequencingWindow;
import net.deckserver.jol.game.command.CommandLogData;
import net.deckserver.jol.game.command.PassSequencing;
import net.deckserver.jol.services.CommandResult;

import java.util.List;

public final class SequencingHandler {
    private SequencingHandler() {}

    public static CommandResult handlePassSequencing(GameData game, PassSequencing cmd, String actor) {
        SequencingWindowState seq = game.getSequencingWindow();
        if (seq == null || !seq.isActive()) return CommandResult.silent(game);
        if (!cmd.playerName().equals(seq.getCurrentHolder())) {
            throw new GameRuleException("It is not your sequencing priority to pass");
        }

        int passes = seq.getConsecutivePasses() + 1;
        seq.setConsecutivePasses(passes);

        if (passes >= seq.getPassOrder().size()) {
            teardownSequencingWindow(game);
            String msg = actor + " passed — all players have passed; sequencing window closes";
            return new CommandResult(game, msg, new CommandLogData.PassSequencingLog(actor));
        }

        List<String> order = seq.getPassOrder();
        int idx = order.indexOf(seq.getCurrentHolder());
        seq.setCurrentHolder(order.get((idx + 1) % order.size()));
        String msg = actor + " passed sequencing priority to " + seq.getCurrentHolder();
        return new CommandResult(game, msg, new CommandLogData.PassSequencingLog(actor));
    }

    public static CommandResult handleCloseSequencingWindow(GameData game, CloseSequencingWindow cmd, String actor) {
        teardownSequencingWindow(game);
        String msg = actor + " closed the sequencing window";
        return new CommandResult(game, msg, new CommandLogData.CloseSequencingWindowLog(actor));
    }

    private static void teardownSequencingWindow(GameData game) {
        game.setSequencingWindow(null);
        PendingActionState pending = game.getPendingAction();
        if (pending != null && pending.getStatus() == ActionStatus.AFTER_RESOLUTION) {
            game.setPendingAction(null);
        }
    }
}

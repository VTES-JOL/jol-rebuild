package net.deckserver.jol.services.handler;

import net.deckserver.jol.enums.ActionStatus;
import net.deckserver.jol.exception.GameRuleException;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.PendingActionState;
import net.deckserver.jol.game.SequencingWindowState;
import net.deckserver.jol.game.command.CloseSequencingWindow;
import net.deckserver.jol.game.command.CommandLogData;
import net.deckserver.jol.game.command.PassSequencing;
import net.deckserver.jol.game.effect.PendingActionChangedEffect;
import net.deckserver.jol.game.effect.SequencingWindowChangedEffect;
import net.deckserver.jol.services.CommandResult;

import java.util.ArrayList;
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
        if (passes >= seq.getPassOrder().size()) {
            List<net.deckserver.jol.game.effect.GameEffect> effects = new ArrayList<>();
            effects.add(new SequencingWindowChangedEffect(false));
            PendingActionState pending = game.getPendingAction();
            if (pending != null && pending.getStatus() == ActionStatus.AFTER_RESOLUTION) {
                effects.add(new PendingActionChangedEffect(false));
            }
            String msg = actor + " passed — all players have passed; sequencing window closes";
            return new CommandResult(game, msg, new CommandLogData.PassSequencingLog(actor), effects);
        }

        List<String> order = seq.getPassOrder();
        int idx = order.indexOf(seq.getCurrentHolder());
        String nextHolder = order.get((idx + 1) % order.size());

        SequencingWindowState updated = new SequencingWindowState();
        updated.setActive(true);
        updated.setWindowType(seq.getWindowType());
        updated.setPassOrder(seq.getPassOrder());
        updated.setConsecutivePasses(passes);
        updated.setCurrentHolder(nextHolder);

        String msg = actor + " passed sequencing priority to " + nextHolder;
        return new CommandResult(game, msg, new CommandLogData.PassSequencingLog(actor),
                List.of(new SequencingWindowChangedEffect(true, updated)));
    }

    public static CommandResult handleCloseSequencingWindow(GameData game, CloseSequencingWindow cmd, String actor) {
        List<net.deckserver.jol.game.effect.GameEffect> effects = new ArrayList<>();
        effects.add(new SequencingWindowChangedEffect(false));
        PendingActionState pending = game.getPendingAction();
        if (pending != null && pending.getStatus() == ActionStatus.AFTER_RESOLUTION) {
            effects.add(new PendingActionChangedEffect(false));
        }
        String msg = actor + " closed the sequencing window";
        return new CommandResult(game, msg, new CommandLogData.CloseSequencingWindowLog(actor), effects);
    }
}

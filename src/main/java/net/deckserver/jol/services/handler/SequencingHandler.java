package net.deckserver.jol.services.handler;

import net.deckserver.jol.enums.ActionStatus;
import net.deckserver.jol.enums.RegionType;
import net.deckserver.jol.enums.SequencingWindowType;
import net.deckserver.jol.exception.GameRuleException;
import net.deckserver.jol.game.*;
import net.deckserver.jol.game.command.CloseSequencingWindow;
import net.deckserver.jol.game.command.CommandLogData;
import net.deckserver.jol.game.command.PassSequencing;
import net.deckserver.jol.game.effect.*;
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
            List<GameEffect> effects = new ArrayList<>();
            effects.add(new SequencingWindowChangedEffect(false));
            addWindowCloseEffects(game, seq.getWindowType(), effects);
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
        SequencingWindowState seq = game.getSequencingWindow();
        SequencingWindowType windowType = seq != null ? seq.getWindowType() : null;

        List<GameEffect> effects = new ArrayList<>();
        effects.add(new SequencingWindowChangedEffect(false));
        addWindowCloseEffects(game, windowType, effects);

        String msg = actor + " closed the sequencing window";
        return new CommandResult(game, msg, new CommandLogData.CloseSequencingWindowLog(actor), effects);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static void addWindowCloseEffects(GameData game, SequencingWindowType windowType, List<GameEffect> effects) {
        if (windowType == SequencingWindowType.CARD_AS_PLAYED) {
            effects.add(new CardPlayChangedEffect(false));
            CardPlayState cps = game.getCardPlayState();
            if (cps != null) {
                PlayerData player = game.getPlayer(cps.getActingPlayer());
                if (player != null) {
                    int handSize = player.getRegion(RegionType.HAND).getCards().size();
                    if (handSize < CardMovementHandler.MAX_HAND_SIZE) {
                        effects.add(new DrawCardEffect(cps.getActingPlayer(), 1));
                    }
                }
            }
        } else if (windowType == SequencingWindowType.BLOCK_ATTEMPT) {
            effects.addAll(ActionHandler.resolveBlockAttempt(game));
        } else if (windowType != null) {
            switch (windowType) {
                case COMBAT_DAMAGE_PREVENTION -> effects.addAll(CombatHandler.applyDamageAndAdvance(game));
                case COMBAT_END_OF_ROUND -> {
                    SequencingWindowState next = CombatHandler.buildCombatWindow(game, SequencingWindowType.COMBAT_WOULD_END);
                    if (next != null) effects.add(new SequencingWindowChangedEffect(true, next));
                }
                case COMBAT_WOULD_END -> {
                    SequencingWindowState next = CombatHandler.buildCombatWindow(game, SequencingWindowType.COMBAT_ABOUT_TO_END);
                    if (next != null) effects.add(new SequencingWindowChangedEffect(true, next));
                }
                case COMBAT_ABOUT_TO_END -> {
                    SequencingWindowState next = CombatHandler.buildCombatWindow(game, SequencingWindowType.COMBAT_ENDS);
                    if (next != null) effects.add(new SequencingWindowChangedEffect(true, next));
                }
                case COMBAT_ENDS -> {
                    SequencingWindowState next = CombatHandler.buildCombatWindow(game, SequencingWindowType.COMBAT_AFTER_ENDS);
                    if (next != null) effects.add(new SequencingWindowChangedEffect(true, next));
                }
                case COMBAT_AFTER_ENDS -> effects.addAll(CombatHandler.clearCombatEffects(game));
                default -> { /* no extra effects */ }
            }
        }
        // Always clear a pending action that reached after-resolution, regardless of which window closed.
        PendingActionState pending = game.getPendingAction();
        if (pending != null && pending.getStatus() == ActionStatus.AFTER_RESOLUTION) {
            effects.add(new PendingActionChangedEffect(false));
        }
    }
}

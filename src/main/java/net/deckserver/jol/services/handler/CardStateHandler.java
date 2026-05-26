package net.deckserver.jol.services.handler;

import net.deckserver.jol.game.CardData;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.command.*;
import net.deckserver.jol.services.CommandResult;
import net.deckserver.jol.services.GameRules;

public final class CardStateHandler {
    private CardStateHandler() {}

    public static CommandResult handleLockCard(GameData game, LockCard cmd) {
        CardData card = GameRules.requireCard(game, cmd.ref());
        card.setLocked(true);
        return CommandResult.silent(game);
    }

    public static CommandResult handleUnlockCard(GameData game, UnlockCard cmd) {
        CardData card = GameRules.requireCard(game, cmd.ref());
        card.setLocked(false);
        return CommandResult.silent(game);
    }

    public static CommandResult handleUnlockAll(GameData game, UnlockAll cmd) {
        HandlerUtils.unlockPlayerCards(game, cmd.playerName());
        return CommandResult.silent(game);
    }

    public static CommandResult handleAddCounter(GameData game, AddCounter cmd, String actor) {
        CardData card = GameRules.requireCard(game, cmd.ref());
        LogCardRef logRef = LogCardRef.of(card, cmd.ref(), HandlerUtils.isHidden(card));
        card.setCounters(card.getCounters() + cmd.amount());
        String msg = actor + " added " + cmd.amount() + " counter(s) to " + HandlerUtils.cardLabel(card, cmd.ref());
        return new CommandResult(game, msg, new CommandLogData.AddCounterLog(actor, logRef, cmd.amount()));
    }

    public static CommandResult handleRemoveCounter(GameData game, RemoveCounter cmd, String actor) {
        CardData card = GameRules.requireCard(game, cmd.ref());
        LogCardRef logRef = LogCardRef.of(card, cmd.ref(), HandlerUtils.isHidden(card));
        card.setCounters(Math.max(0, card.getCounters() - cmd.amount()));
        String msg = actor + " removed " + cmd.amount() + " counter(s) from " + HandlerUtils.cardLabel(card, cmd.ref());
        return new CommandResult(game, msg, new CommandLogData.RemoveCounterLog(actor, logRef, cmd.amount()));
    }

    public static CommandResult handleSetCardNotes(GameData game, SetCardNotes cmd) {
        CardData card = GameRules.requireCard(game, cmd.ref());
        card.setNotes(cmd.notes());
        return CommandResult.silent(game);
    }
}

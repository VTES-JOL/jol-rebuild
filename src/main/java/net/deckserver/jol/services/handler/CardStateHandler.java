package net.deckserver.jol.services.handler;

import net.deckserver.jol.game.CardData;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.PlayerData;
import net.deckserver.jol.game.command.*;
import net.deckserver.jol.game.effect.CardCounterChangedEffect;
import net.deckserver.jol.game.effect.CardLockedEffect;
import net.deckserver.jol.game.effect.GameEffect;
import net.deckserver.jol.services.CommandResult;
import net.deckserver.jol.services.GameRules;

import java.util.List;

public final class CardStateHandler {
    private CardStateHandler() {}

    public static CommandResult handleLockCard(GameData game, LockCard cmd) {
        CardData card = GameRules.requireCard(game, cmd.ref());
        return new CommandResult(game, null, null,
                List.of(new CardLockedEffect(card.getId(), true)));
    }

    public static CommandResult handleUnlockCard(GameData game, UnlockCard cmd) {
        CardData card = GameRules.requireCard(game, cmd.ref());
        return new CommandResult(game, null, null,
                List.of(new CardLockedEffect(card.getId(), false)));
    }

    public static CommandResult handleUnlockAll(GameData game, UnlockAll cmd, String actor) {
        PlayerData player = game.getPlayer(cmd.playerName());
        if (player == null) return CommandResult.silent(game);
        List<GameEffect> effects = HandlerUtils.buildUnlockEffects(player);
        String msg = actor + " unlocked all cards for " + cmd.playerName();
        return new CommandResult(game, msg, null, effects);
    }

    public static CommandResult handleAddCounter(GameData game, AddCounter cmd, String actor) {
        CardData card = GameRules.requireCard(game, cmd.ref());
        LogCardRef logRef = LogCardRef.of(card, cmd.ref(), HandlerUtils.isHidden(card));
        String msg = actor + " added " + cmd.amount() + " counter(s) to " + HandlerUtils.cardLabel(card, cmd.ref());
        return new CommandResult(game, msg, new CommandLogData.AddCounterLog(actor, logRef, cmd.amount()),
                List.of(new CardCounterChangedEffect(card.getId(), cmd.amount())));
    }

    public static CommandResult handleRemoveCounter(GameData game, RemoveCounter cmd, String actor) {
        CardData card = GameRules.requireCard(game, cmd.ref());
        LogCardRef logRef = LogCardRef.of(card, cmd.ref(), HandlerUtils.isHidden(card));
        String msg = actor + " removed " + cmd.amount() + " counter(s) from " + HandlerUtils.cardLabel(card, cmd.ref());
        return new CommandResult(game, msg, new CommandLogData.RemoveCounterLog(actor, logRef, cmd.amount()),
                List.of(new CardCounterChangedEffect(card.getId(), -cmd.amount())));
    }

    public static CommandResult handleSetCardNotes(GameData game, SetCardNotes cmd) {
        CardData card = GameRules.requireCard(game, cmd.ref());
        card.setNotes(cmd.notes());
        return CommandResult.silent(game);
    }
}

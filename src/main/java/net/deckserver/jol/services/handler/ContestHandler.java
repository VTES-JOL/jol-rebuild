package net.deckserver.jol.services.handler;

import net.deckserver.jol.game.CardData;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.command.*;
import net.deckserver.jol.services.CommandResult;
import net.deckserver.jol.services.GameRules;

public final class ContestHandler {
    private ContestHandler() {}

    public static CommandResult handleContestCard(GameData game, ContestCard cmd, String actor) {
        CardData card = GameRules.requireCard(game, cmd.ref());
        LogCardRef logRef = LogCardRef.of(card, cmd.ref(), false);
        card.setContested(true);
        String msg = actor + " contested " + HandlerUtils.cardToken(card);
        return new CommandResult(game, msg, new CommandLogData.ContestCardLog(actor, logRef));
    }

    public static CommandResult handleClearContestCard(GameData game, ClearContestCard cmd, String actor) {
        CardData card = GameRules.requireCard(game, cmd.ref());
        LogCardRef logRef = LogCardRef.of(card, cmd.ref(), false);
        card.setContested(false);
        String msg = actor + " uncontested " + HandlerUtils.cardToken(card);
        return new CommandResult(game, msg, new CommandLogData.ClearContestCardLog(actor, logRef));
    }

    public static CommandResult handleSetTitle(GameData game, SetTitle cmd, String actor) {
        CardData card = GameRules.requireCard(game, cmd.ref());
        LogCardRef logRef = LogCardRef.of(card, cmd.ref(), false);
        card.setTitle(cmd.title());
        String msg = actor + " set " + HandlerUtils.cardToken(card) + "'s title to " + cmd.title();
        return new CommandResult(game, msg, new CommandLogData.SetTitleLog(actor, logRef, cmd.title()));
    }
}

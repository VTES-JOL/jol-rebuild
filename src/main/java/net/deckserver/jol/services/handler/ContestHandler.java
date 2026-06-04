package net.deckserver.jol.services.handler;

import net.deckserver.jol.game.CardData;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.command.*;
import net.deckserver.jol.game.effect.CardContestedEffect;
import net.deckserver.jol.game.effect.CardTitleChangedEffect;
import net.deckserver.jol.services.CommandResult;
import net.deckserver.jol.services.GameRules;

import java.util.List;

public final class ContestHandler {
    private ContestHandler() {}

    public static CommandResult handleContestCard(GameData game, ContestCard cmd, String actor) {
        CardData card = GameRules.requireCard(game, cmd.ref());
        LogCardRef logRef = LogCardRef.of(card, cmd.ref(), false);
        String msg = actor + " contested " + HandlerUtils.cardToken(card);
        return new CommandResult(game, msg, new CommandLogData.ContestCardLog(actor, logRef),
                List.of(new CardContestedEffect(card.getId(), true)));
    }

    public static CommandResult handleClearContestCard(GameData game, ClearContestCard cmd, String actor) {
        CardData card = GameRules.requireCard(game, cmd.ref());
        LogCardRef logRef = LogCardRef.of(card, cmd.ref(), false);
        String msg = actor + " uncontested " + HandlerUtils.cardToken(card);
        return new CommandResult(game, msg, new CommandLogData.ClearContestCardLog(actor, logRef),
                List.of(new CardContestedEffect(card.getId(), false)));
    }

    public static CommandResult handleSetTitle(GameData game, SetTitle cmd, String actor) {
        CardData card = GameRules.requireCard(game, cmd.ref());
        LogCardRef logRef = LogCardRef.of(card, cmd.ref(), false);
        String msg = actor + " set " + HandlerUtils.cardToken(card) + "'s title to " + cmd.title();
        return new CommandResult(game, msg, new CommandLogData.SetTitleLog(actor, logRef, cmd.title()),
                List.of(new CardTitleChangedEffect(card.getId(), cmd.title())));
    }
}

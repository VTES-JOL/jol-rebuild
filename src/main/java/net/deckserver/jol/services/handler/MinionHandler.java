package net.deckserver.jol.services.handler;

import net.deckserver.jol.enums.RegionType;
import net.deckserver.jol.game.CardData;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.PlayerData;
import net.deckserver.jol.game.command.*;
import net.deckserver.jol.services.CommandResult;
import net.deckserver.jol.services.GameRules;

public final class MinionHandler {
    private MinionHandler() {}

    public static CommandResult handleMoveToTorpor(GameData game, MoveToTorpor cmd, String actor) {
        CardData card = GameRules.requireCard(game, cmd.ref());
        LogCardRef logRef = LogCardRef.of(card, cmd.ref(), false);
        String token = HandlerUtils.cardToken(card);
        PlayerData owner = GameRules.requireOwner(card);
        owner.getRegion(RegionType.TORPOR).addCard(card, false);
        String msg = actor + " sent " + token + " to Torpor";
        return new CommandResult(game, msg, new CommandLogData.MoveToTorporLog(actor, logRef));
    }

    public static CommandResult handleRescueFromTorpor(GameData game, RescueFromTorpor cmd, String actor) {
        CardData card = GameRules.requireCard(game, cmd.ref());
        LogCardRef logRef = LogCardRef.of(card, cmd.ref(), false);
        String token = HandlerUtils.cardToken(card);
        PlayerData owner = GameRules.requireOwner(card);
        owner.getRegion(RegionType.READY).addCard(card, false);
        String msg = actor + " rescued " + token + " from Torpor";
        return new CommandResult(game, msg, new CommandLogData.RescueFromTorporLog(actor, logRef));
    }

    public static CommandResult handleBurnMinion(GameData game, BurnMinion cmd, String actor) {
        CardData card = GameRules.requireCard(game, cmd.ref());
        LogCardRef logRef = LogCardRef.of(card, cmd.ref(), false);
        String token = HandlerUtils.cardToken(card);
        PlayerData owner = GameRules.requireOwner(card);
        owner.getRegion(RegionType.ASH_HEAP).addCard(card, false);
        String msg = actor + " burned " + token;
        return new CommandResult(game, msg, new CommandLogData.BurnMinionLog(actor, logRef));
    }
}

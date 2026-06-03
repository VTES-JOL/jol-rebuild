package net.deckserver.jol.services.handler;

import net.deckserver.jol.enums.RegionType;
import net.deckserver.jol.game.CardData;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.PlayerData;
import net.deckserver.jol.game.RegionData;
import net.deckserver.jol.game.command.*;
import net.deckserver.jol.game.effect.CardAttachedEffect;
import net.deckserver.jol.game.effect.CardMovedEffect;
import net.deckserver.jol.services.CommandResult;
import net.deckserver.jol.services.GameRules;

import java.util.List;

public final class CardMovementHandler {
    private CardMovementHandler() {}

    public static CommandResult handleDiscardCard(GameData game, DiscardCard cmd, String actor) {
        CardData card = GameRules.requireCard(game, cmd.ref());
        LogCardRef logRef = LogCardRef.of(card, cmd.ref(), false);
        String token = HandlerUtils.cardToken(card);
        PlayerData owner = GameRules.requireOwner(card);
        owner.getRegion(RegionType.ASH_HEAP).addCard(card, true);
        String msg = actor + " discarded " + token;
        return new CommandResult(game, msg, new CommandLogData.DiscardCardLog(actor, logRef),
                List.of(new CardMovedEffect(card.getId(), owner.getName(), RegionType.ASH_HEAP.name())));
    }

    public static CommandResult handlePlayCard(GameData game, PlayCard cmd, String actor) {
        CardData card = GameRules.requireCard(game, cmd.ref());
        boolean hiddenInTarget = cmd.targetRegionType() != null && !cmd.targetRegionType().otherVisibility();
        LogCardRef logRef = LogCardRef.of(card, cmd.ref(), hiddenInTarget);
        String token = HandlerUtils.cardToken(card);
        if (cmd.targetPlayerName() == null || cmd.targetRegionType() == null) {
            PlayerData owner = card.getOwner();
            if (owner != null) owner.getRegion(RegionType.ASH_HEAP).addCard(card, false);
            String msg = actor + " played " + token;
            String targetPlayer = owner != null ? owner.getName() : actor;
            return new CommandResult(game, msg, new CommandLogData.PlayCardLog(actor, logRef),
                    List.of(new CardMovedEffect(card.getId(), targetPlayer, RegionType.ASH_HEAP.name())));
        }
        PlayerData targetPlayer = GameRules.requirePlayer(game, cmd.targetPlayerName());
        RegionData target = targetPlayer.getRegion(cmd.targetRegionType());
        if (target != null) target.addCard(card, false);
        String msg = actor + " played " + token;
        return new CommandResult(game, msg, new CommandLogData.PlayCardLog(actor, logRef),
                List.of(new CardMovedEffect(card.getId(), cmd.targetPlayerName(), cmd.targetRegionType().name())));
    }

    public static CommandResult handleMoveCard(GameData game, MoveCard cmd, String actor) {
        CardData card = GameRules.requireCard(game, cmd.ref());
        RegionData sourceRegion = card.getRegion();
        boolean sourceVisible = sourceRegion != null && sourceRegion.getType().otherVisibility();
        boolean destVisible = cmd.targetRegionType().otherVisibility();
        boolean hidden = !(sourceVisible || destVisible);
        LogCardRef logRef = LogCardRef.of(card, cmd.ref(), hidden);
        String label = hidden ? HandlerUtils.cardLabel(card, cmd.ref()) : HandlerUtils.cardToken(card);
        PlayerData targetPlayer = GameRules.requirePlayer(game, cmd.targetPlayerName());
        RegionData target = targetPlayer.getRegion(cmd.targetRegionType());
        if (target == null) throw new net.deckserver.jol.exception.GameRuleException("Target region not found");
        target.addCard(card, cmd.position());
        String msg = actor + " moved " + label + " to " + cmd.targetPlayerName() + "'s " + cmd.targetRegionType().description();
        return new CommandResult(game, msg,
                new CommandLogData.MoveCardLog(actor, logRef, cmd.targetPlayerName(), cmd.targetRegionType().name()),
                List.of(new CardMovedEffect(card.getId(), cmd.targetPlayerName(), cmd.targetRegionType().name())));
    }

    public static CommandResult handleAttachCard(GameData game, AttachCard cmd, String actor) {
        CardData card = GameRules.requireCard(game, cmd.ref());
        CardData target = GameRules.requireCard(game, cmd.targetRef());
        LogCardRef cardRef = LogCardRef.of(card, cmd.ref(), false);
        LogCardRef targetRef = LogCardRef.of(target, cmd.targetRef(), false);
        String cardToken = HandlerUtils.cardToken(card);
        String targetToken = HandlerUtils.cardToken(target);
        target.add(card, false);
        String msg = actor + " attached " + cardToken + " to " + targetToken;
        return new CommandResult(game, msg, new CommandLogData.AttachCardLog(actor, cardRef, targetRef),
                List.of(new CardAttachedEffect(card.getId(), target.getId())));
    }
}

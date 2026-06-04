package net.deckserver.jol.services.handler;

import net.deckserver.jol.enums.Phase;
import net.deckserver.jol.enums.RegionType;
import net.deckserver.jol.exception.GameRuleException;
import net.deckserver.jol.game.CardData;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.PlayerData;
import net.deckserver.jol.game.command.*;
import net.deckserver.jol.game.effect.*;

import java.util.ArrayList;
import java.util.List;
import net.deckserver.jol.services.CommandResult;
import net.deckserver.jol.services.GameRules;

public final class InfluenceHandler {
    private InfluenceHandler() {}

    public static CommandResult handleTransferBlood(GameData game, TransferBlood cmd, String actor) {
        CardData card = GameRules.requireCard(game, cmd.ref());
        PlayerData controller = GameRules.requireController(card);
        LogCardRef logRef = LogCardRef.of(card, cmd.ref(), HandlerUtils.isHidden(card));
        int amount = cmd.amount();

        List<GameEffect> effects = new ArrayList<>();
        if (cmd.ref().regionType() == RegionType.UNCONTROLLED) {
            GameRules.requirePhase(game, Phase.INFLUENCE);
            GameRules.requireCurrentPlayer(game, actor);
            int cost = amount > 0 ? amount : Math.abs(amount) * 2;
            GameRules.requireTransferBudget(game, cost);
            effects.add(new TransfersRemainingChangedEffect(game.getTransfersRemaining() - cost));
        }

        effects.add(new PlayerPoolChangedEffect(controller.getName(), -amount));
        effects.add(new CardCounterChangedEffect(card.getId(), amount));

        String label = HandlerUtils.cardLabel(card, cmd.ref());
        String msg = amount > 0
                ? actor + " transferred " + amount + " blood to " + label
                : actor + " transferred " + Math.abs(amount) + " blood from " + label;
        return new CommandResult(game, msg, new CommandLogData.TransferBloodLog(actor, logRef, amount), effects);
    }

    public static CommandResult handleInfluenceCard(GameData game, InfluenceCard cmd, String actor) {
        CardData card = GameRules.requireCard(game, cmd.ref());
        GameRules.requireCardInRegion(card, RegionType.UNCONTROLLED);
        GameRules.requirePhase(game, Phase.INFLUENCE);
        GameRules.requireCurrentPlayer(game, actor);
        if (card.getCapacity() <= 0 || card.getCounters() < card.getCapacity()) {
            throw new GameRuleException(
                    "Vampire requires " + card.getCapacity() + " blood to influence (has " + card.getCounters() + ")");
        }
        LogCardRef logRef = LogCardRef.of(card, cmd.ref(), false);
        String token = HandlerUtils.cardToken(card);
        PlayerData owner = GameRules.requireOwner(card);
        String msg = actor + " moved " + token + " to the Ready region";
        return new CommandResult(game, msg, new CommandLogData.InfluenceCardLog(actor, logRef),
                List.of(new CardMovedEffect(card.getId(), owner.getName(), RegionType.READY.name())));
    }

    public static CommandResult handleMoveToCrypt(GameData game, MoveToCrypt cmd, String actor) {
        CardData card = GameRules.requireCard(game, cmd.ref());
        LogCardRef logRef = LogCardRef.of(card, cmd.ref(), false);
        String token = HandlerUtils.cardToken(card);
        PlayerData owner = GameRules.requireOwner(card);
        List<GameEffect> effects = new ArrayList<>();
        effects.add(new CardCounterChangedEffect(card.getId(), -card.getCounters()));
        effects.add(new CardMovedEffect(card.getId(), owner.getName(), RegionType.CRYPT.name()));
        String msg = actor + " returned " + token + " to the Crypt";
        return new CommandResult(game, msg, new CommandLogData.MoveToCryptLog(actor, logRef), effects);
    }

    public static CommandResult handleDrawCryptToUncontrolled(GameData game, DrawCryptToUncontrolled cmd, String actor) {
        GameRules.requirePhase(game, Phase.INFLUENCE);
        GameRules.requireCurrentPlayer(game, actor);
        PlayerData player = GameRules.requirePlayer(game, actor);
        if (player.getRegion(RegionType.CRYPT).getCards().isEmpty()) {
            throw new GameRuleException("Crypt is empty");
        }
        GameRules.requireTransferBudget(game, 4);
        if (player.getPool() < 1) {
            throw new GameRuleException("Insufficient pool to draw from crypt (costs 1 pool)");
        }
        CardData drawn = player.getRegion(RegionType.CRYPT).getFirstCard();
        String msg = actor + " drew a card from crypt to the uncontrolled region (4 transfers, 1 pool)";
        return new CommandResult(game, msg, new CommandLogData.DrawCryptToUncontrolledLog(actor),
                List.of(new TransfersRemainingChangedEffect(game.getTransfersRemaining() - 4),
                        new PlayerPoolChangedEffect(actor, -1),
                        new CardMovedEffect(drawn.getId(), actor, RegionType.UNCONTROLLED.name())));
    }

    public static CommandResult handleMergeAdvanced(GameData game, MergeAdvanced cmd, String actor) {
        GameRules.requirePhase(game, Phase.INFLUENCE);
        GameRules.requireCurrentPlayer(game, actor);
        CardData card = GameRules.requireCard(game, cmd.ref());
        CardData target = GameRules.requireCard(game, cmd.targetRef());
        GameRules.requireCardInRegion(card, RegionType.UNCONTROLLED);
        GameRules.requireCardInRegion(target, RegionType.READY);
        if (card.getName() == null || !card.getName().equals(target.getName())) {
            throw new GameRuleException("Vampires must have the same name to merge");
        }
        if (card.isAdvanced() == target.isAdvanced()) {
            throw new GameRuleException("One vampire must be the advanced version and the other must not");
        }
        LogCardRef cardRef = LogCardRef.of(card, cmd.ref(), false);
        LogCardRef targetRef = LogCardRef.of(target, cmd.targetRef(), false);
        String cardToken = HandlerUtils.cardToken(card);
        String targetToken = HandlerUtils.cardToken(target);
        PlayerData owner = GameRules.requireOwner(card);

        List<GameEffect> effects = new ArrayList<>();
        effects.add(new CardCounterChangedEffect(card.getId(), -card.getCounters()));
        List.copyOf(card.getCards()).forEach(child ->
                effects.add(new CardMovedEffect(child.getId(), owner.getName(), RegionType.ASH_HEAP.name())));
        effects.add(new CardAttachedEffect(card.getId(), target.getId()));

        String msg = actor + " merged " + cardToken + " with " + targetToken;
        return new CommandResult(game, msg, new CommandLogData.MergeAdvancedLog(actor, cardRef, targetRef), effects);
    }
}

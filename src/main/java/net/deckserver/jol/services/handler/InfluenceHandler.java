package net.deckserver.jol.services.handler;

import net.deckserver.jol.enums.Phase;
import net.deckserver.jol.enums.RegionType;
import net.deckserver.jol.exception.GameRuleException;
import net.deckserver.jol.game.CardData;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.PlayerData;
import net.deckserver.jol.game.RegionData;
import net.deckserver.jol.game.command.*;

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

        // Transfers to/from UNCONTROLLED vampires are only valid during the current player's
        // influence phase and consume the transfer budget.
        // Pool → card costs 1 transfer per blood; card → pool costs 2 transfers per blood.
        if (cmd.ref().regionType() == RegionType.UNCONTROLLED) {
            GameRules.requirePhase(game, Phase.INFLUENCE);
            GameRules.requireCurrentPlayer(game, actor);
            int cost = amount > 0 ? amount : Math.abs(amount) * 2;
            GameRules.requireTransferBudget(game, cost);
            game.setTransfersRemaining(game.getTransfersRemaining() - cost);
        }

        controller.setPool(Math.max(0, controller.getPool() - amount));
        card.setCounters(Math.max(0, card.getCounters() + amount));
        String label = HandlerUtils.cardLabel(card, cmd.ref());
        String msg = amount > 0
                ? actor + " transferred " + amount + " blood to " + label
                : actor + " transferred " + Math.abs(amount) + " blood from " + label;
        return new CommandResult(game, msg, new CommandLogData.TransferBloodLog(actor, logRef, amount));
    }

    public static CommandResult handleInfluenceCard(GameData game, InfluenceCard cmd, String actor) {
        CardData card = GameRules.requireCard(game, cmd.ref());
        GameRules.requireCardInRegion(card, RegionType.UNCONTROLLED);
        GameRules.requirePhase(game, Phase.INFLUENCE);
        GameRules.requireCurrentPlayer(game, actor);
        if (card.getCapacity() <= 0 || card.getCounters() < card.getCapacity()) {
            throw new net.deckserver.jol.exception.GameRuleException(
                    "Vampire requires " + card.getCapacity() + " blood to influence (has " + card.getCounters() + ")");
        }
        LogCardRef logRef = LogCardRef.of(card, cmd.ref(), false);
        String token = HandlerUtils.cardToken(card);
        PlayerData owner = GameRules.requireOwner(card);
        owner.getRegion(RegionType.READY).addCard(card, false);
        String msg = actor + " moved " + token + " to the Ready region";
        return new CommandResult(game, msg, new CommandLogData.InfluenceCardLog(actor, logRef));
    }

    public static CommandResult handleMoveToCrypt(GameData game, MoveToCrypt cmd, String actor) {
        CardData card = GameRules.requireCard(game, cmd.ref());
        LogCardRef logRef = LogCardRef.of(card, cmd.ref(), false);
        String token = HandlerUtils.cardToken(card);
        PlayerData owner = GameRules.requireOwner(card);
        card.setCounters(0);
        owner.getRegion(RegionType.CRYPT).addCard(card, false);
        String msg = actor + " returned " + token + " to the Crypt";
        return new CommandResult(game, msg, new CommandLogData.MoveToCryptLog(actor, logRef));
    }

    public static CommandResult handleDrawCryptToUncontrolled(GameData game, DrawCryptToUncontrolled cmd, String actor) {
        GameRules.requirePhase(game, Phase.INFLUENCE);
        GameRules.requireCurrentPlayer(game, actor);
        PlayerData player = GameRules.requirePlayer(game, actor);
        RegionData crypt = player.getRegion(RegionType.CRYPT);
        if (crypt.getCards().isEmpty()) {
            throw new GameRuleException("Crypt is empty");
        }
        GameRules.requireTransferBudget(game, 4);
        if (player.getPool() < 1) {
            throw new GameRuleException("Insufficient pool to draw from crypt (costs 1 pool)");
        }
        game.setTransfersRemaining(game.getTransfersRemaining() - 4);
        player.setPool(player.getPool() - 1);
        player.getRegion(RegionType.UNCONTROLLED).addCard(crypt.getFirstCard(), false);
        String msg = actor + " drew a card from crypt to the uncontrolled region (4 transfers, 1 pool)";
        return new CommandResult(game, msg, new CommandLogData.DrawCryptToUncontrolledLog(actor));
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
        // Burn counters and attached cards on the incoming uncontrolled card
        card.setCounters(0);
        PlayerData owner = GameRules.requireOwner(card);
        RegionData ashHeap = owner.getRegion(RegionType.ASH_HEAP);
        List.copyOf(card.getCards()).forEach(child -> ashHeap.addCard(child, false));
        // Attach the uncontrolled card to the ready card; target's counters and attachments are untouched
        target.add(card, false);
        String msg = actor + " merged " + cardToken + " with " + targetToken;
        return new CommandResult(game, msg, new CommandLogData.MergeAdvancedLog(actor, cardRef, targetRef));
    }
}

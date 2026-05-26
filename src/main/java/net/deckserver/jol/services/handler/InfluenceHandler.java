package net.deckserver.jol.services.handler;

import net.deckserver.jol.enums.Phase;
import net.deckserver.jol.enums.RegionType;
import net.deckserver.jol.game.CardData;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.PlayerData;
import net.deckserver.jol.game.command.*;
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
        GameRules.requireCardInRegion(GameRules.requireCard(game, cmd.ref()), RegionType.UNCONTROLLED);
        GameRules.requirePhase(game, Phase.INFLUENCE);
        GameRules.requireCurrentPlayer(game, actor);
        CardData card = GameRules.requireCard(game, cmd.ref());
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
}

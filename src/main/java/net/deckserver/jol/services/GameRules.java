package net.deckserver.jol.services;

import net.deckserver.jol.enums.Phase;
import net.deckserver.jol.enums.RegionType;
import net.deckserver.jol.exception.GameRuleException;
import net.deckserver.jol.game.CardData;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.PlayerData;
import net.deckserver.jol.game.command.CardRef;

public final class GameRules {
    private GameRules() {}

    public static CardData requireCard(GameData game, CardRef ref) {
        CardData card = game.getCardByRef(ref);
        if (card == null) throw new GameRuleException("Card not found");
        return card;
    }

    public static PlayerData requirePlayer(GameData game, String playerName) {
        PlayerData player = game.getPlayer(playerName);
        if (player == null) throw new GameRuleException("Player not found: " + playerName);
        return player;
    }

    public static PlayerData requireOwner(CardData card) {
        PlayerData owner = card.getOwner();
        if (owner == null) throw new GameRuleException("Card has no owner");
        return owner;
    }

    public static PlayerData requireController(CardData card) {
        PlayerData controller = card.getController();
        if (controller == null) throw new GameRuleException("Card has no controller");
        return controller;
    }

    public static void requirePhase(GameData game, Phase phase) {
        if (game.getPhase() != phase) {
            throw new GameRuleException("This action requires the " + phase.getDescription() + " phase");
        }
    }

    public static void requireCurrentPlayer(GameData game, String actor) {
        if (!actor.equals(game.getCurrentPlayerName())) {
            throw new GameRuleException("It is not your turn");
        }
    }

    public static void requireTransferBudget(GameData game, int cost) {
        if (game.getTransfersRemaining() < cost) {
            throw new GameRuleException("Insufficient transfer budget ("
                    + cost + " needed, " + game.getTransfersRemaining() + " remaining)");
        }
    }

    public static void requireCardInRegion(CardData card, RegionType regionType) {
        var region = card.getRegion();
        if (region == null || region.getType() != regionType) {
            throw new GameRuleException("Card must be in " + regionType.description());
        }
    }
}

package net.deckserver.jol.game.effect;

import net.deckserver.jol.enums.Phase;
import net.deckserver.jol.enums.RegionType;
import net.deckserver.jol.game.CardData;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.PlayerData;
import net.deckserver.jol.game.RegionData;

/**
 * Applies a GameEffect to a GameData instance and returns a human-readable description
 * of what changed, suitable for the effect log. Returns null for changes that should
 * not produce visible log entries (e.g. hidden-region card movements).
 */
public final class GameEffectApplicator {
    private GameEffectApplicator() {}

    public static String apply(GameData game, GameEffect effect) {
        return switch (effect) {
            case CardMovedEffect e              -> applyCardMoved(game, e);
            case CardLockedEffect e             -> applyCardLocked(game, e);
            case CardCounterChangedEffect e     -> applyCardCounterChanged(game, e);
            case CardAttachedEffect e           -> applyCardAttached(game, e);
            case CardContestedEffect e          -> applyCardContested(game, e);
            case CardTitleChangedEffect e       -> applyCardTitle(game, e);
            case PlayerPoolChangedEffect e      -> applyPlayerPoolChanged(game, e);
            case PlayerOustedEffect e           -> applyPlayerOusted(game, e);
            case PlayerVictoryPointsChangedEffect e -> applyVictoryPoints(game, e);
            case EdgeChangedEffect e            -> applyEdgeChanged(game, e);
            case PhaseChangedEffect e           -> applyPhaseChanged(game, e);
            case TurnChangedEffect e            -> applyTurnChanged(game, e);
            case TransfersRemainingChangedEffect e -> applyTransfersRemaining(game, e);
            case ImpulseWindowChangedEffect e   -> applyImpulseWindow(game, e);
            case PendingActionChangedEffect e   -> applyPendingAction(game, e);
            case SequencingWindowChangedEffect e -> applySequencingWindow(game, e);
            case GameNotesChangedEffect e       -> applyGameNotes(game, e);
            case GameModeChangedEffect e        -> applyGameMode(game, e);
            case GameCompletedEffect e          -> applyGameCompleted(game, e);
            case OrderOfPlayReversedEffect e    -> applyOrderReversed(game, e);
        };
    }

    private static String applyCardMoved(GameData game, CardMovedEffect e) {
        CardData card = game.getCard(e.cardId());
        if (card == null) return null;
        PlayerData targetPlayer = game.getPlayer(e.targetPlayerName());
        if (targetPlayer == null) return null;
        RegionType regionType = RegionType.valueOf(e.targetRegionType());
        RegionData targetRegion = targetPlayer.getRegion(regionType);
        if (targetRegion == null) return null;
        targetRegion.addCard(card, e.position());
        if (!regionType.otherVisibility()) return null;
        return card.getName() + " moved to " + e.targetPlayerName() + "'s " + regionType.description();
    }

    private static String applyCardLocked(GameData game, CardLockedEffect e) {
        CardData card = game.getCard(e.cardId());
        if (card == null) return null;
        card.setLocked(e.locked());
        return card.getName() + (e.locked() ? " is now locked" : " is now unlocked");
    }

    private static String applyCardCounterChanged(GameData game, CardCounterChangedEffect e) {
        CardData card = game.getCard(e.cardId());
        if (card == null) return null;
        int newVal = Math.max(0, card.getCounters() + e.delta());
        card.setCounters(newVal);
        String dir = e.delta() > 0 ? "+" + e.delta() : String.valueOf(e.delta());
        return card.getName() + " counters " + dir + " (now " + newVal + ")";
    }

    private static String applyCardAttached(GameData game, CardAttachedEffect e) {
        CardData card = game.getCard(e.cardId());
        CardData parent = game.getCard(e.parentCardId());
        if (card == null || parent == null) return null;
        parent.add(card, false);
        return card.getName() + " attached to " + parent.getName();
    }

    private static String applyCardContested(GameData game, CardContestedEffect e) {
        CardData card = game.getCard(e.cardId());
        if (card == null) return null;
        card.setContested(e.contested());
        return card.getName() + (e.contested() ? " is now contested" : " is no longer contested");
    }

    private static String applyCardTitle(GameData game, CardTitleChangedEffect e) {
        CardData card = game.getCard(e.cardId());
        if (card == null) return null;
        card.setTitle(e.title());
        return card.getName() + " title set to " + e.title();
    }

    private static String applyPlayerPoolChanged(GameData game, PlayerPoolChangedEffect e) {
        PlayerData player = game.getPlayer(e.playerName());
        if (player == null) return null;
        int newPool = player.getPool() + e.delta();
        player.setPool(newPool);
        String dir = e.delta() > 0 ? "gained " + e.delta() : "lost " + Math.abs(e.delta());
        return e.playerName() + " " + dir + " pool (now " + newPool + ")";
    }

    private static String applyPlayerOusted(GameData game, PlayerOustedEffect e) {
        game.updatePredatorMapping();
        return e.playerName() + " has been ousted";
    }

    private static String applyVictoryPoints(GameData game, PlayerVictoryPointsChangedEffect e) {
        PlayerData player = game.getPlayer(e.playerName());
        if (player == null) return null;
        player.addVictoryPoints(e.delta());
        return e.playerName() + " gained " + e.delta() + " VP";
    }

    private static String applyEdgeChanged(GameData game, EdgeChangedEffect e) {
        if (e.holderName() == null) {
            game.setEdge(null);
            return "The Edge is now unclaimed";
        }
        PlayerData player = game.getPlayer(e.holderName());
        if (player == null) return null;
        game.setEdge(player);
        return e.holderName() + " now holds the Edge";
    }

    private static String applyPhaseChanged(GameData game, PhaseChangedEffect e) {
        Phase phase = Phase.valueOf(e.phase());
        game.setPhase(phase);
        if (phase == Phase.INFLUENCE) {
            game.setTransfersRemaining(computeTransferBudget(game));
        }
        return "Phase is now " + phase.getDescription();
    }

    private static String applyTurnChanged(GameData game, TurnChangedEffect e) {
        game.setTurn(e.turn());
        PlayerData player = game.getPlayer(e.currentPlayerName());
        if (player != null) game.setCurrentPlayer(player);
        game.setTransfersRemaining(0);
        return "Turn " + e.turn() + " — " + e.currentPlayerName() + " begins";
    }

    private static String applyTransfersRemaining(GameData game, TransfersRemainingChangedEffect e) {
        game.setTransfersRemaining(e.newValue());
        return "Transfers remaining: " + e.newValue();
    }

    private static String applyImpulseWindow(GameData game, ImpulseWindowChangedEffect e) {
        game.setImpulseWindow(e.state());
        return e.active() ? "Impulse window opened" : "Impulse window closed";
    }

    private static String applyPendingAction(GameData game, PendingActionChangedEffect e) {
        game.setPendingAction(e.state());
        return e.active() ? "Action is now in progress" : "Action resolved";
    }

    private static String applySequencingWindow(GameData game, SequencingWindowChangedEffect e) {
        game.setSequencingWindow(e.state());
        return e.active() ? "Sequencing window opened" : "Sequencing window closed";
    }

    private static String applyGameNotes(GameData game, GameNotesChangedEffect e) {
        game.setNotes(e.notes());
        return null;
    }

    private static String applyGameMode(GameData game, GameModeChangedEffect e) {
        game.setRulesEnforced(e.rulesEnforced());
        return "Game mode: " + (e.rulesEnforced() ? "rules-enforced" : "permissive");
    }

    private static String applyGameCompleted(GameData game, GameCompletedEffect e) {
        game.setCompleted(true);
        return "The game is over";
    }

    private static String applyOrderReversed(GameData game, OrderOfPlayReversedEffect e) {
        game.setOrderOfPlayReversed(e.reversed());
        return "Order of play is now " + (e.reversed() ? "reversed" : "normal");
    }

    static int computeTransferBudget(GameData game) {
        String[] parts = game.getTurn().split("\\.");
        int major = Integer.parseInt(parts[0]);
        if (major >= 2) return 4;
        int minor = parts.length > 1 ? Integer.parseInt(parts[1]) : 1;
        return Math.min(minor, 4);
    }
}

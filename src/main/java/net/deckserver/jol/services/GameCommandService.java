package net.deckserver.jol.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import net.deckserver.jol.entity.Game;
import net.deckserver.jol.enums.Phase;
import net.deckserver.jol.enums.RegionType;
import net.deckserver.jol.game.CardData;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.PlayerData;
import net.deckserver.jol.game.RegionData;
import net.deckserver.jol.game.command.*;
import org.jboss.logging.Logger;

import java.util.List;

@ApplicationScoped
public class GameCommandService {

    private static final Logger LOG = Logger.getLogger(GameCommandService.class);

    @Inject
    GameStateStore store;

    @Inject
    ObjectMapper mapper;

    public record CommandResult(GameData game, String logMessage) {}

    /**
     * Validates, applies the command to the in-memory game state, persists a snapshot,
     * and returns the result including an optional chat log message.
     * Synchronized on the GameData instance so concurrent commands for the same game are serialized.
     */
    @Transactional
    public CommandResult execute(String actorUsername, GameCommand command) {
        GameData game = store.get(command.gameId());
        if (game == null) {
            throw new IllegalStateException("Game not active: " + command.gameId());
        }
        String logMessage;
        synchronized (game) {
            logMessage = applyCommand(game, command, actorUsername);
            persistSnapshot(command.gameId(), game);
        }
        return new CommandResult(game, logMessage);
    }

    // ── Dispatch ─────────────────────────────────────────────────────────────

    private String applyCommand(GameData game, GameCommand cmd, String actor) {
        return switch (cmd) {
            case AdvancePhase c     -> handleAdvancePhase(game, c, actor);
            case NextTurn c         -> handleNextTurn(game, c, actor);
            case DrawCard c         -> handleDrawCard(game, c, actor);
            case ShuffleLibrary c   -> handleShuffleLibrary(game, actor);
            case ShuffleCrypt c     -> handleShuffleCrypt(game, actor);
            case DiscardCard c      -> handleDiscardCard(game, c, actor);
            case PlayCard c         -> handlePlayCard(game, c, actor);
            case MoveCard c         -> handleMoveCard(game, c, actor);
            case AttachCard c       -> handleAttachCard(game, c, actor);
            case LockCard c         -> { handleLockCard(game, c); yield null; }
            case UnlockCard c       -> { handleUnlockCard(game, c); yield null; }
            case UnlockAll c        -> { handleUnlockAll(game, c); yield null; }
            case AddCounter c       -> handleAddCounter(game, c, actor);
            case RemoveCounter c    -> handleRemoveCounter(game, c, actor);
            case SetCardNotes c     -> { handleSetCardNotes(game, c); yield null; }
            case SetPool c          -> handleSetPool(game, c, actor);
            case TransferPool c     -> handleTransferPool(game, c, actor);
            case GainEdge c         -> handleGainEdge(game, c, actor);
            case InfluenceVampire c -> handleInfluenceVampire(game, c, actor);
            case MoveToReady c      -> handleMoveToReady(game, c, actor);
            case MoveToCrypt c      -> handleMoveToCrypt(game, c, actor);
            case MoveToTorpor c     -> handleMoveToTorpor(game, c, actor);
            case RescueFromTorpor c -> handleRescueFromTorpor(game, c, actor);
            case BurnMinion c       -> handleBurnMinion(game, c, actor);
            case ContestCard c      -> handleContestCard(game, c, actor);
            case UncontestCard c    -> handleUncontestCard(game, c, actor);
            case SetTitle c         -> handleSetTitle(game, c, actor);
            case OustPlayer c       -> handleOustPlayer(game, c, actor);
            case SetChoice c        -> { handleSetChoice(game, c); yield null; }
            case ReverseOrder c     -> handleReverseOrder(game, c, actor);
            case SetGameNotes c     -> { handleSetGameNotes(game, c); yield null; }
        };
    }

    // ── Turn / phase ──────────────────────────────────────────────────────────

    private String handleAdvancePhase(GameData game, AdvancePhase cmd, String actor) {
        Phase[] phases = Phase.values();
        int current = game.getPhase() != null ? game.getPhase().ordinal() : 0;
        int next = (current + 1) % phases.length;
        if (next == 0) {
            return handleNextTurn(game, new NextTurn(cmd.gameId()), actor);
        } else {
            game.setPhase(phases[next]);
            return actor + " advanced to " + phases[next].getDescription() + " phase";
        }
    }

    private String handleNextTurn(GameData game, NextTurn cmd, String actor) {
        List<String> order = game.getPlayerOrder();
        String currentName = game.getCurrentPlayerName();
        int currentIndex = currentName != null ? order.indexOf(currentName) : -1;

        // Find next non-ousted player
        int size = order.size();
        int nextIndex = currentIndex;
        for (int i = 1; i <= size; i++) {
            nextIndex = (currentIndex + i) % size;
            PlayerData candidate = game.getPlayer(order.get(nextIndex));
            if (candidate != null && !candidate.isOusted()) break;
        }

        // Advance the turn counter
        String[] parts = game.getTurn() != null ? game.getTurn().split("\\.") : new String[]{"1", "0"};
        int major = Integer.parseInt(parts[0]);
        int minor = parts.length > 1 ? Integer.parseInt(parts[1]) : 0;
        minor++;
        if (minor > size) {
            major++;
            minor = 1;
        }
        game.setTurn(major + "." + minor);

        PlayerData nextPlayer = game.getPlayer(order.get(nextIndex));
        game.setCurrentPlayer(nextPlayer);
        game.setPhase(Phase.UNLOCK);

        // Auto-unlock all cards for the new current player
        if (nextPlayer != null) {
            unlockPlayerCards(game, nextPlayer.getName());
        }

        String nextPlayerName = nextPlayer != null ? nextPlayer.getName() : "unknown";
        return "Turn " + major + "." + minor + " — " + nextPlayerName + " begins their turn";
    }

    // ── Deck operations ───────────────────────────────────────────────────────

    private String handleDrawCard(GameData game, DrawCard cmd, String actor) {
        PlayerData player = game.getPlayer(actor);
        if (player == null) return null;
        RegionData library = player.getRegion(RegionType.LIBRARY);
        RegionData hand = player.getRegion(RegionType.HAND);
        int toDraw = Math.min(cmd.count(), library.getCards().size());
        for (int i = 0; i < toDraw; i++) {
            if (library.getCards().isEmpty()) break;
            hand.addCard(library.getFirstCard(), false);
        }
        return actor + " drew " + toDraw + " card(s)";
    }

    private String handleShuffleLibrary(GameData game, String actor) {
        PlayerData player = game.getPlayer(actor);
        if (player == null) return null;
        player.getRegion(RegionType.LIBRARY).shuffle(0);
        return actor + " shuffled their library";
    }

    private String handleShuffleCrypt(GameData game, String actor) {
        PlayerData player = game.getPlayer(actor);
        if (player == null) return null;
        player.getRegion(RegionType.CRYPT).shuffle(0);
        return actor + " shuffled their crypt";
    }

    // ── Hand / play ───────────────────────────────────────────────────────────

    private String handleDiscardCard(GameData game, DiscardCard cmd, String actor) {
        CardData card = game.getCardByRef(cmd.ref());
        if (card == null) return null;
        String name = card.getName();
        PlayerData owner = card.getOwner();
        if (owner == null) return null;
        owner.getRegion(RegionType.ASH_HEAP).addCard(card, false);
        return actor + " discarded " + name;
    }

    private String handlePlayCard(GameData game, PlayCard cmd, String actor) {
        CardData card = game.getCardByRef(cmd.ref());
        if (card == null) return null;
        String name = card.getName();
        if (cmd.targetPlayerName() == null || cmd.targetRegionType() == null) {
            PlayerData owner = card.getOwner();
            if (owner != null) owner.getRegion(RegionType.ASH_HEAP).addCard(card, false);
            return actor + " played " + name;
        }
        PlayerData targetPlayer = game.getPlayer(cmd.targetPlayerName());
        if (targetPlayer == null) return null;
        RegionData target = targetPlayer.getRegion(cmd.targetRegionType());
        if (target != null) target.addCard(card, false);
        return actor + " played " + name;
    }

    private String handleMoveCard(GameData game, MoveCard cmd, String actor) {
        CardData card = game.getCardByRef(cmd.ref());
        if (card == null) return null;
        String name = card.getName();
        PlayerData targetPlayer = game.getPlayer(cmd.targetPlayerName());
        if (targetPlayer == null) return null;
        RegionData target = targetPlayer.getRegion(cmd.targetRegionType());
        if (target == null) return null;
        target.addCard(card, cmd.position());
        return actor + " moved " + name + " to " + cmd.targetPlayerName() + "'s " + cmd.targetRegionType().description();
    }

    private String handleAttachCard(GameData game, AttachCard cmd, String actor) {
        CardData card = game.getCardByRef(cmd.ref());
        CardData target = game.getCardByRef(cmd.targetRef());
        if (card == null || target == null) return null;
        String cardName = card.getName();
        String targetName = target.getName();
        target.add(card, false);
        return actor + " attached " + cardName + " to " + targetName;
    }

    // ── Card state ────────────────────────────────────────────────────────────

    private void handleLockCard(GameData game, LockCard cmd) {
        CardData card = game.getCardByRef(cmd.ref());
        if (card != null) card.setLocked(true);
    }

    private void handleUnlockCard(GameData game, UnlockCard cmd) {
        CardData card = game.getCardByRef(cmd.ref());
        if (card != null) card.setLocked(false);
    }

    private void handleUnlockAll(GameData game, UnlockAll cmd) {
        unlockPlayerCards(game, cmd.playerName());
    }

    private String handleAddCounter(GameData game, AddCounter cmd, String actor) {
        CardData card = game.getCardByRef(cmd.ref());
        if (card == null) return null;
        card.setCounters(card.getCounters() + cmd.amount());
        return actor + " added " + cmd.amount() + " counter(s) to " + card.getName();
    }

    private String handleRemoveCounter(GameData game, RemoveCounter cmd, String actor) {
        CardData card = game.getCardByRef(cmd.ref());
        if (card == null) return null;
        card.setCounters(Math.max(0, card.getCounters() - cmd.amount()));
        return actor + " removed " + cmd.amount() + " counter(s) from " + card.getName();
    }

    private void handleSetCardNotes(GameData game, SetCardNotes cmd) {
        CardData card = game.getCardByRef(cmd.ref());
        if (card != null) card.setNotes(cmd.notes());
    }

    // ── Pool / edge ───────────────────────────────────────────────────────────

    private String handleSetPool(GameData game, SetPool cmd, String actor) {
        PlayerData player = game.getPlayer(cmd.playerName());
        if (player == null) return null;
        player.setPool(cmd.amount());
        return actor + " set " + cmd.playerName() + "'s pool to " + cmd.amount();
    }

    private String handleTransferPool(GameData game, TransferPool cmd, String actor) {
        PlayerData player = game.getPlayer(cmd.playerName());
        CardData card = game.getCardByRef(cmd.ref());
        if (player == null || card == null) return null;
        int amount = cmd.amount();
        // positive = pool → card, negative = card → pool
        player.setPool(Math.max(0, player.getPool() + (-amount)));
        card.setCounters(Math.max(0, card.getCounters() + amount));
        if (amount > 0) {
            return actor + " transferred " + amount + " blood from pool to " + card.getName();
        } else {
            return actor + " transferred " + Math.abs(amount) + " blood from " + card.getName() + " to pool";
        }
    }

    private String handleGainEdge(GameData game, GainEdge cmd, String actor) {
        PlayerData player = game.getPlayer(cmd.playerName());
        game.setEdge(player);
        return actor + " gained the Edge";
    }

    // ── Influence / crypt ─────────────────────────────────────────────────────

    private String handleInfluenceVampire(GameData game, InfluenceVampire cmd, String actor) {
        CardData card = game.getCardByRef(cmd.ref());
        if (card == null) return null;
        String name = card.getName();
        PlayerData owner = card.getOwner();
        if (owner == null) return null;
        int amount = Math.min(cmd.amount(), owner.getPool());
        owner.setPool(owner.getPool() - amount);
        card.setCounters(card.getCounters() + amount);
        return actor + " influenced " + name + " with " + amount + " blood";
    }

    private String handleMoveToReady(GameData game, MoveToReady cmd, String actor) {
        CardData card = game.getCardByRef(cmd.ref());
        if (card == null) return null;
        String name = card.getName();
        PlayerData owner = card.getOwner();
        if (owner == null) return null;
        owner.getRegion(RegionType.READY).addCard(card, false);
        return actor + " moved " + name + " to the Ready region";
    }

    private String handleMoveToCrypt(GameData game, MoveToCrypt cmd, String actor) {
        CardData card = game.getCardByRef(cmd.ref());
        if (card == null) return null;
        String name = card.getName();
        PlayerData owner = card.getOwner();
        if (owner == null) return null;
        card.setCounters(0);
        owner.getRegion(RegionType.CRYPT).addCard(card, false);
        return actor + " returned " + name + " to the Crypt";
    }

    // ── Minion state ──────────────────────────────────────────────────────────

    private String handleMoveToTorpor(GameData game, MoveToTorpor cmd, String actor) {
        CardData card = game.getCardByRef(cmd.ref());
        if (card == null) return null;
        String name = card.getName();
        PlayerData owner = card.getOwner();
        if (owner == null) return null;
        owner.getRegion(RegionType.TORPOR).addCard(card, false);
        return actor + " sent " + name + " to Torpor";
    }

    private String handleRescueFromTorpor(GameData game, RescueFromTorpor cmd, String actor) {
        CardData card = game.getCardByRef(cmd.ref());
        if (card == null) return null;
        String name = card.getName();
        PlayerData owner = card.getOwner();
        if (owner == null) return null;
        owner.getRegion(RegionType.READY).addCard(card, false);
        return actor + " rescued " + name + " from Torpor";
    }

    private String handleBurnMinion(GameData game, BurnMinion cmd, String actor) {
        CardData card = game.getCardByRef(cmd.ref());
        if (card == null) return null;
        String name = card.getName();
        PlayerData owner = card.getOwner();
        if (owner == null) return null;
        owner.getRegion(RegionType.ASH_HEAP).addCard(card, false);
        return actor + " burned " + name;
    }

    // ── Contesting / title ────────────────────────────────────────────────────

    private String handleContestCard(GameData game, ContestCard cmd, String actor) {
        CardData card = game.getCardByRef(cmd.ref());
        if (card == null) return null;
        card.setContested(true);
        return actor + " contested " + card.getName();
    }

    private String handleUncontestCard(GameData game, UncontestCard cmd, String actor) {
        CardData card = game.getCardByRef(cmd.ref());
        if (card == null) return null;
        card.setContested(false);
        return actor + " uncontested " + card.getName();
    }

    private String handleSetTitle(GameData game, SetTitle cmd, String actor) {
        CardData card = game.getCardByRef(cmd.ref());
        if (card == null) return null;
        card.setTitle(cmd.title());
        return actor + " set " + card.getName() + "'s title to " + cmd.title();
    }

    // ── Player ────────────────────────────────────────────────────────────────

    private String handleOustPlayer(GameData game, OustPlayer cmd, String actor) {
        PlayerData ousted = game.getPlayer(cmd.playerName());
        if (ousted == null) return null;
        ousted.setOusted(true);

        // Award 1 VP to the predator (if any)
        PlayerData predator = ousted.getPredator();
        if (predator != null) {
            predator.addVictoryPoints(1.0f);
        }

        // Rebuild predator-prey ring excluding ousted players
        game.updatePredatorMapping();

        // If the ousted player was the current player, advance the turn
        if (cmd.playerName().equals(game.getCurrentPlayerName())) {
            handleNextTurn(game, new NextTurn(cmd.gameId()), actor);
        }

        return actor + " ousted " + cmd.playerName();
    }

    private void handleSetChoice(GameData game, SetChoice cmd) {
        PlayerData player = game.getPlayer(cmd.playerName());
        if (player != null) player.setChoice(cmd.choice());
    }

    private String handleReverseOrder(GameData game, ReverseOrder cmd, String actor) {
        game.setOrderOfPlayReversed(!game.isOrderOfPlayReversed());
        return actor + " reversed the order of play";
    }

    private void handleSetGameNotes(GameData game, SetGameNotes cmd) {
        game.setNotes(cmd.notes());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void unlockPlayerCards(GameData game, String playerName) {
        PlayerData player = game.getPlayer(playerName);
        if (player == null) return;
        for (RegionType type : RegionType.IN_PLAY_REGIONS) {
            RegionData region = player.getRegion(type);
            for (CardData card : region.getCards()) {
                card.setLocked(false);
                for (CardData child : card.getCards()) {
                    child.setLocked(false);
                }
            }
        }
    }

    private void persistSnapshot(String gameId, GameData gameData) {
        try {
            Game game = Game.findById(gameId);
            if (game != null) {
                game.gameState = mapper.writeValueAsString(gameData);
            }
        } catch (Exception e) {
            LOG.errorf(e, "Failed to persist game snapshot for %s", gameId);
        }
    }
}

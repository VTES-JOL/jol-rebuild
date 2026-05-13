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

    /**
     * Validates, applies the command to the in-memory game state, persists a snapshot,
     * and returns the updated GameData. Synchronized on the GameData instance so
     * concurrent commands for the same game are serialized.
     */
    @Transactional
    public GameData execute(String actorUsername, GameCommand command) {
        GameData game = store.get(command.gameId());
        if (game == null) {
            throw new IllegalStateException("Game not active: " + command.gameId());
        }
        synchronized (game) {
            applyCommand(game, command, actorUsername);
            persistSnapshot(command.gameId(), game);
        }
        return game;
    }

    // ── Dispatch ─────────────────────────────────────────────────────────────

    private void applyCommand(GameData game, GameCommand cmd, String actor) {
        switch (cmd) {
            case AdvancePhase c     -> handleAdvancePhase(game, c);
            case NextTurn c         -> handleNextTurn(game, c);
            case DrawCard c         -> handleDrawCard(game, c, actor);
            case ShuffleLibrary c   -> handleShuffleLibrary(game, actor);
            case ShuffleCrypt c     -> handleShuffleCrypt(game, actor);
            case DiscardCard c      -> handleDiscardCard(game, c);
            case PlayCard c         -> handlePlayCard(game, c);
            case MoveCard c         -> handleMoveCard(game, c);
            case AttachCard c       -> handleAttachCard(game, c);
            case LockCard c         -> handleLockCard(game, c);
            case UnlockCard c       -> handleUnlockCard(game, c);
            case UnlockAll c        -> handleUnlockAll(game, c);
            case AddCounter c       -> handleAddCounter(game, c);
            case RemoveCounter c    -> handleRemoveCounter(game, c);
            case SetCardNotes c     -> handleSetCardNotes(game, c);
            case SetPool c          -> handleSetPool(game, c);
            case TransferPool c     -> handleTransferPool(game, c);
            case GainEdge c         -> handleGainEdge(game, c);
            case InfluenceVampire c -> handleInfluenceVampire(game, c);
            case MoveToReady c      -> handleMoveToReady(game, c);
            case MoveToCrypt c      -> handleMoveToCrypt(game, c);
            case MoveToTorpor c     -> handleMoveToTorpor(game, c);
            case RescueFromTorpor c -> handleRescueFromTorpor(game, c);
            case BurnMinion c       -> handleBurnMinion(game, c);
            case ContestCard c      -> handleContestCard(game, c);
            case UncontestCard c    -> handleUncontestCard(game, c);
            case SetTitle c         -> handleSetTitle(game, c);
            case OustPlayer c       -> handleOustPlayer(game, c);
            case SetChoice c        -> handleSetChoice(game, c);
            case ReverseOrder c     -> handleReverseOrder(game, c);
            case SetGameNotes c     -> handleSetGameNotes(game, c);
        }
    }

    // ── Turn / phase ──────────────────────────────────────────────────────────

    private void handleAdvancePhase(GameData game, AdvancePhase cmd) {
        Phase[] phases = Phase.values();
        int current = game.getPhase() != null ? game.getPhase().ordinal() : 0;
        int next = (current + 1) % phases.length;
        if (next == 0) {
            handleNextTurn(game, new NextTurn(cmd.gameId()));
        } else {
            game.setPhase(phases[next]);
        }
    }

    private void handleNextTurn(GameData game, NextTurn cmd) {
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
    }

    // ── Deck operations ───────────────────────────────────────────────────────

    private void handleDrawCard(GameData game, DrawCard cmd, String actor) {
        PlayerData player = game.getPlayer(actor);
        if (player == null) return;
        RegionData library = player.getRegion(RegionType.LIBRARY);
        RegionData hand = player.getRegion(RegionType.HAND);
        int toDraw = Math.min(cmd.count(), library.getCards().size());
        for (int i = 0; i < toDraw; i++) {
            if (library.getCards().isEmpty()) break;
            hand.addCard(library.getFirstCard(), false);
        }
    }

    private void handleShuffleLibrary(GameData game, String actor) {
        PlayerData player = game.getPlayer(actor);
        if (player == null) return;
        player.getRegion(RegionType.LIBRARY).shuffle(0);
    }

    private void handleShuffleCrypt(GameData game, String actor) {
        PlayerData player = game.getPlayer(actor);
        if (player == null) return;
        player.getRegion(RegionType.CRYPT).shuffle(0);
    }

    // ── Hand / play ───────────────────────────────────────────────────────────

    private void handleDiscardCard(GameData game, DiscardCard cmd) {
        CardData card = game.getCard(cmd.cardId());
        if (card == null) return;
        PlayerData owner = card.getOwner();
        if (owner == null) return;
        owner.getRegion(RegionType.ASH_HEAP).addCard(card, false);
    }

    private void handlePlayCard(GameData game, PlayCard cmd) {
        CardData card = game.getCard(cmd.cardId());
        if (card == null) return;
        if (cmd.targetRegionId() == null) {
            handleDiscardCard(game, new DiscardCard(cmd.gameId(), cmd.cardId()));
            return;
        }
        RegionData target = findRegionById(game, cmd.targetRegionId());
        if (target != null) {
            target.addCard(card, false);
        }
    }

    private void handleMoveCard(GameData game, MoveCard cmd) {
        CardData card = game.getCard(cmd.cardId());
        if (card == null) return;
        RegionData target = findRegionById(game, cmd.targetRegionId());
        if (target == null) return;
        target.addCard(card, cmd.position());
    }

    private void handleAttachCard(GameData game, AttachCard cmd) {
        CardData card = game.getCard(cmd.cardId());
        CardData target = game.getCard(cmd.targetCardId());
        if (card == null || target == null) return;
        target.add(card, false);
    }

    // ── Card state ────────────────────────────────────────────────────────────

    private void handleLockCard(GameData game, LockCard cmd) {
        CardData card = game.getCard(cmd.cardId());
        if (card != null) card.setLocked(true);
    }

    private void handleUnlockCard(GameData game, UnlockCard cmd) {
        CardData card = game.getCard(cmd.cardId());
        if (card != null) card.setLocked(false);
    }

    private void handleUnlockAll(GameData game, UnlockAll cmd) {
        unlockPlayerCards(game, cmd.playerName());
    }

    private void handleAddCounter(GameData game, AddCounter cmd) {
        CardData card = game.getCard(cmd.cardId());
        if (card != null) card.setCounters(card.getCounters() + cmd.amount());
    }

    private void handleRemoveCounter(GameData game, RemoveCounter cmd) {
        CardData card = game.getCard(cmd.cardId());
        if (card != null) card.setCounters(Math.max(0, card.getCounters() - cmd.amount()));
    }

    private void handleSetCardNotes(GameData game, SetCardNotes cmd) {
        CardData card = game.getCard(cmd.cardId());
        if (card != null) card.setNotes(cmd.notes());
    }

    // ── Pool / edge ───────────────────────────────────────────────────────────

    private void handleSetPool(GameData game, SetPool cmd) {
        PlayerData player = game.getPlayer(cmd.playerName());
        if (player != null) player.setPool(cmd.amount());
    }

    private void handleTransferPool(GameData game, TransferPool cmd) {
        PlayerData player = game.getPlayer(cmd.playerName());
        CardData card = game.getCard(cmd.cardId());
        if (player == null || card == null) return;
        int amount = cmd.amount();
        // positive = pool → card, negative = card → pool
        int poolDelta = -amount;
        int cardDelta = amount;
        player.setPool(Math.max(0, player.getPool() + poolDelta));
        card.setCounters(Math.max(0, card.getCounters() + cardDelta));
    }

    private void handleGainEdge(GameData game, GainEdge cmd) {
        PlayerData player = game.getPlayer(cmd.playerName());
        game.setEdge(player);
    }

    // ── Influence / crypt ─────────────────────────────────────────────────────

    private void handleInfluenceVampire(GameData game, InfluenceVampire cmd) {
        CardData card = game.getCard(cmd.cardId());
        if (card == null) return;
        PlayerData owner = card.getOwner();
        if (owner == null) return;
        int amount = Math.min(cmd.amount(), owner.getPool());
        owner.setPool(owner.getPool() - amount);
        card.setCounters(card.getCounters() + amount);
    }

    private void handleMoveToReady(GameData game, MoveToReady cmd) {
        CardData card = game.getCard(cmd.cardId());
        if (card == null) return;
        PlayerData owner = card.getOwner();
        if (owner == null) return;
        owner.getRegion(RegionType.READY).addCard(card, false);
    }

    private void handleMoveToCrypt(GameData game, MoveToCrypt cmd) {
        CardData card = game.getCard(cmd.cardId());
        if (card == null) return;
        PlayerData owner = card.getOwner();
        if (owner == null) return;
        card.setCounters(0);
        owner.getRegion(RegionType.CRYPT).addCard(card, false);
    }

    // ── Minion state ──────────────────────────────────────────────────────────

    private void handleMoveToTorpor(GameData game, MoveToTorpor cmd) {
        CardData card = game.getCard(cmd.cardId());
        if (card == null) return;
        PlayerData owner = card.getOwner();
        if (owner == null) return;
        owner.getRegion(RegionType.TORPOR).addCard(card, false);
    }

    private void handleRescueFromTorpor(GameData game, RescueFromTorpor cmd) {
        CardData card = game.getCard(cmd.cardId());
        if (card == null) return;
        PlayerData owner = card.getOwner();
        if (owner == null) return;
        owner.getRegion(RegionType.READY).addCard(card, false);
    }

    private void handleBurnMinion(GameData game, BurnMinion cmd) {
        CardData card = game.getCard(cmd.cardId());
        if (card == null) return;
        PlayerData owner = card.getOwner();
        if (owner == null) return;
        owner.getRegion(RegionType.ASH_HEAP).addCard(card, false);
    }

    // ── Contesting / title ────────────────────────────────────────────────────

    private void handleContestCard(GameData game, ContestCard cmd) {
        CardData card = game.getCard(cmd.cardId());
        if (card != null) card.setContested(true);
    }

    private void handleUncontestCard(GameData game, UncontestCard cmd) {
        CardData card = game.getCard(cmd.cardId());
        if (card != null) card.setContested(false);
    }

    private void handleSetTitle(GameData game, SetTitle cmd) {
        CardData card = game.getCard(cmd.cardId());
        if (card != null) card.setTitle(cmd.title());
    }

    // ── Player ────────────────────────────────────────────────────────────────

    private void handleOustPlayer(GameData game, OustPlayer cmd) {
        PlayerData ousted = game.getPlayer(cmd.playerName());
        if (ousted == null) return;
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
            handleNextTurn(game, new NextTurn(cmd.gameId()));
        }
    }

    private void handleSetChoice(GameData game, SetChoice cmd) {
        PlayerData player = game.getPlayer(cmd.playerName());
        if (player != null) player.setChoice(cmd.choice());
    }

    private void handleReverseOrder(GameData game, ReverseOrder cmd) {
        game.setOrderOfPlayReversed(!game.isOrderOfPlayReversed());
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

    private RegionData findRegionById(GameData game, String regionId) {
        for (PlayerData player : game.getPlayers().values()) {
            for (RegionData region : player.getRegions().values()) {
                if (regionId.equals(region.getId())) {
                    return region;
                }
            }
        }
        return null;
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

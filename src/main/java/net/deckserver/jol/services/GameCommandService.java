package net.deckserver.jol.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import net.deckserver.jol.entity.Game;
import net.deckserver.jol.enums.ImpulseContext;
import net.deckserver.jol.enums.Phase;
import net.deckserver.jol.enums.RegionType;
import net.deckserver.jol.game.CardData;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.ImpulseState;
import net.deckserver.jol.game.PlayerData;
import net.deckserver.jol.game.RegionData;
import net.deckserver.jol.game.command.*;
import org.jboss.logging.Logger;

import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class GameCommandService {

    private static final Logger LOG = Logger.getLogger(GameCommandService.class);

    @Inject
    GameStateStore store;

    @Inject
    ObjectMapper mapper;

    public record CommandResult(GameData game, String logMessage, CommandLogData commandLog) {
        public static CommandResult silent(GameData game) {
            return new CommandResult(game, null, null);
        }
    }

    /**
     * Validates, applies the command to the in-memory game state, persists a snapshot,
     * and returns the result including an optional structured log entry.
     * Synchronized on the GameData instance so concurrent commands for the same game are serialized.
     */
    @Transactional
    public CommandResult execute(String actorUsername, GameCommand command) {
        GameData game = store.get(command.gameId());
        if (game == null) {
            throw new IllegalStateException("Game not active: " + command.gameId());
        }
        CommandResult result;
        synchronized (game) {
            result = applyCommand(game, command, actorUsername);
            persistSnapshot(command.gameId(), result.game());
        }
        return result;
    }

    // ── Dispatch ─────────────────────────────────────────────────────────────

    private CommandResult applyCommand(GameData game, GameCommand cmd, String actor) {
        return switch (cmd) {
            case AdvancePhase c     -> handleAdvancePhase(game, c, actor);
            case NextTurn c         -> handleNextTurn(game, c, actor);
            case DrawCard c         -> handleDrawCard(game, c, actor);
            case DrawCrypt c        -> handleDrawCrypt(game, c, actor);
            case ShuffleLibrary c   -> handleShuffleLibrary(game, actor);
            case ShuffleCrypt c     -> handleShuffleCrypt(game, actor);
            case DiscardCard c      -> handleDiscardCard(game, c, actor);
            case PlayCard c         -> handlePlayCard(game, c, actor);
            case MoveCard c         -> handleMoveCard(game, c, actor);
            case AttachCard c       -> handleAttachCard(game, c, actor);
            case LockCard c         -> { handleLockCard(game, c); yield CommandResult.silent(game); }
            case UnlockCard c       -> { handleUnlockCard(game, c); yield CommandResult.silent(game); }
            case UnlockAll c        -> { handleUnlockAll(game, c); yield CommandResult.silent(game); }
            case AddCounter c       -> handleAddCounter(game, c, actor);
            case RemoveCounter c    -> handleRemoveCounter(game, c, actor);
            case SetCardNotes c     -> { handleSetCardNotes(game, c); yield CommandResult.silent(game); }
            case SetPool c          -> handleSetPool(game, c, actor);
            case GainEdge c         -> handleGainEdge(game, c, actor);
            case TransferBlood c    -> handleTransferBlood(game, c, actor);
            case InfluenceCard c    -> handleInfluenceCard(game, c, actor);
            case MoveToCrypt c      -> handleMoveToCrypt(game, c, actor);
            case MoveToTorpor c     -> handleMoveToTorpor(game, c, actor);
            case RescueFromTorpor c -> handleRescueFromTorpor(game, c, actor);
            case BurnMinion c       -> handleBurnMinion(game, c, actor);
            case ContestCard c      -> handleContestCard(game, c, actor);
            case ClearContestCard c -> handleClearContestCard(game, c, actor);
            case SetTitle c         -> handleSetTitle(game, c, actor);
            case OustPlayer c       -> handleOustPlayer(game, c, actor);
            case SetChoice c            -> { handleSetChoice(game, c); yield CommandResult.silent(game); }
            case ReverseOrder c         -> handleReverseOrder(game, c, actor);
            case SetGameNotes c         -> { handleSetGameNotes(game, c); yield CommandResult.silent(game); }
            case OpenImpulseWindow c    -> handleOpenImpulseWindow(game, c, actor);
            case PassImpulse c          -> handlePassImpulse(game, c, actor);
            case ClaimImpulse c         -> handleClaimImpulse(game, c, actor);
            case CloseImpulseWindow c   -> handleCloseImpulseWindow(game, c, actor);
        };
    }

    // ── Turn / phase ──────────────────────────────────────────────────────────

    private CommandResult handleAdvancePhase(GameData game, AdvancePhase cmd, String actor) {
        Phase[] phases = Phase.values();
        int current = game.getPhase() != null ? game.getPhase().ordinal() : 0;
        int next = (current + 1) % phases.length;
        if (next == 0) {
            return handleNextTurn(game, new NextTurn(cmd.gameId()), actor);
        } else {
            game.setPhase(phases[next]);
            if (phases[next] == Phase.INFLUENCE) {
                game.setTransfersRemaining(computeTransferBudget(game));
            }
            String msg = actor + " advanced to " + phases[next].getDescription() + " phase";
            return new CommandResult(game, msg, new CommandLogData.AdvancePhaseLog(actor, phases[next]));
        }
    }

    private int computeTransferBudget(GameData game) {
        String[] parts = game.getTurn().split("\\.");
        int major = Integer.parseInt(parts[0]);
        if (major >= 2) return 4;
        int minor = parts.length > 1 ? Integer.parseInt(parts[1]) : 1;
        return Math.min(minor, 4);
    }

    private CommandResult handleNextTurn(GameData game, NextTurn cmd, String actor) {
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
        game.setTransfersRemaining(0);

        // Auto-unlock all cards for the new current player
        if (nextPlayer != null) {
            unlockPlayerCards(game, nextPlayer.getName());
        }

        String nextPlayerName = nextPlayer != null ? nextPlayer.getName() : "unknown";
        String turn = major + "." + minor;
        String msg = "Turn " + turn + " — " + nextPlayerName + " begins their turn";
        return new CommandResult(game, msg, new CommandLogData.NextTurnLog(actor, turn, nextPlayerName));
    }

    // ── Deck operations ───────────────────────────────────────────────────────

    private CommandResult handleDrawCard(GameData game, DrawCard cmd, String actor) {
        PlayerData player = game.getPlayer(actor);
        if (player == null) return CommandResult.silent(game);
        RegionData library = player.getRegion(RegionType.LIBRARY);
        RegionData hand = player.getRegion(RegionType.HAND);
        int toDraw = Math.min(cmd.count(), library.getCards().size());
        for (int i = 0; i < toDraw; i++) {
            if (library.getCards().isEmpty()) break;
            hand.addCard(library.getFirstCard(), false);
        }
        String msg = actor + " drew " + toDraw + " card(s)";
        return new CommandResult(game, msg, new CommandLogData.DrawCardLog(actor, toDraw));
    }

    private CommandResult handleDrawCrypt(GameData game, DrawCrypt cmd, String actor) {
        PlayerData player = game.getPlayer(actor);
        if (player == null) return CommandResult.silent(game);
        RegionData crypt = player.getRegion(RegionType.CRYPT);
        RegionData uncontrolled = player.getRegion(RegionType.UNCONTROLLED);
        int toDraw = Math.min(cmd.count(), crypt.getCards().size());
        for (int i = 0; i < toDraw; i++) {
            if (crypt.getCards().isEmpty()) break;
            uncontrolled.addCard(crypt.getFirstCard(), false);
        }
        String msg = actor + " drew " + toDraw + " card(s) from crypt";
        return new CommandResult(game, msg, new CommandLogData.DrawCryptLog(actor, toDraw));
    }

    private CommandResult handleShuffleLibrary(GameData game, String actor) {
        PlayerData player = game.getPlayer(actor);
        if (player == null) return CommandResult.silent(game);
        player.getRegion(RegionType.LIBRARY).shuffle(0);
        String msg = actor + " shuffled their library";
        return new CommandResult(game, msg, new CommandLogData.ShuffleLibraryLog(actor));
    }

    private CommandResult handleShuffleCrypt(GameData game, String actor) {
        PlayerData player = game.getPlayer(actor);
        if (player == null) return CommandResult.silent(game);
        player.getRegion(RegionType.CRYPT).shuffle(0);
        String msg = actor + " shuffled their crypt";
        return new CommandResult(game, msg, new CommandLogData.ShuffleCryptLog(actor));
    }

    // ── Hand / play ───────────────────────────────────────────────────────────

    private CommandResult handleDiscardCard(GameData game, DiscardCard cmd, String actor) {
        CardData card = game.getCardByRef(cmd.ref());
        if (card == null) return CommandResult.silent(game);
        LogCardRef logRef = LogCardRef.of(card, cmd.ref(), false); // ASH_HEAP is visible to all
        String token = cardToken(card);
        PlayerData owner = card.getOwner();
        if (owner == null) return CommandResult.silent(game);
        owner.getRegion(RegionType.ASH_HEAP).addCard(card, true);
        String msg = actor + " discarded " + token;
        return new CommandResult(game, msg, new CommandLogData.DiscardCardLog(actor, logRef));
    }

    private CommandResult handlePlayCard(GameData game, PlayCard cmd, String actor) {
        CardData card = game.getCardByRef(cmd.ref());
        if (card == null) return CommandResult.silent(game);
        // Playing a card always reveals it regardless of source region
        boolean hiddenInTarget = cmd.targetRegionType() != null && !cmd.targetRegionType().otherVisibility();
        LogCardRef logRef = LogCardRef.of(card, cmd.ref(), hiddenInTarget);
        String token = cardToken(card);
        if (cmd.targetPlayerName() == null || cmd.targetRegionType() == null) {
            PlayerData owner = card.getOwner();
            if (owner != null) owner.getRegion(RegionType.ASH_HEAP).addCard(card, false);
            String msg = actor + " played " + token;
            return new CommandResult(game, msg, new CommandLogData.PlayCardLog(actor, logRef));
        }
        PlayerData targetPlayer = game.getPlayer(cmd.targetPlayerName());
        if (targetPlayer == null) return CommandResult.silent(game);
        RegionData target = targetPlayer.getRegion(cmd.targetRegionType());
        if (target != null) target.addCard(card, false);
        String msg = actor + " played " + token;
        return new CommandResult(game, msg, new CommandLogData.PlayCardLog(actor, logRef));
    }

    private CommandResult handleMoveCard(GameData game, MoveCard cmd, String actor) {
        CardData card = game.getCardByRef(cmd.ref());
        if (card == null) return CommandResult.silent(game);
        // Show card name if it was visible at any point — source OR destination visible to all
        RegionData sourceRegion = card.getRegion();
        boolean sourceVisible = sourceRegion != null && sourceRegion.getType().otherVisibility();
        boolean destVisible = cmd.targetRegionType().otherVisibility();
        boolean hidden = !(sourceVisible || destVisible);
        LogCardRef logRef = LogCardRef.of(card, cmd.ref(), hidden);
        String label = hidden ? cardLabel(card, cmd.ref()) : cardToken(card);
        PlayerData targetPlayer = game.getPlayer(cmd.targetPlayerName());
        if (targetPlayer == null) return CommandResult.silent(game);
        RegionData target = targetPlayer.getRegion(cmd.targetRegionType());
        if (target == null) return CommandResult.silent(game);
        target.addCard(card, cmd.position());
        String msg = actor + " moved " + label + " to " + cmd.targetPlayerName() + "'s " + cmd.targetRegionType().description();
        return new CommandResult(game, msg,
                new CommandLogData.MoveCardLog(actor, logRef, cmd.targetPlayerName(), cmd.targetRegionType().name()));
    }

    private CommandResult handleAttachCard(GameData game, AttachCard cmd, String actor) {
        CardData card = game.getCardByRef(cmd.ref());
        CardData target = game.getCardByRef(cmd.targetRef());
        if (card == null || target == null) return CommandResult.silent(game);
        LogCardRef cardRef = LogCardRef.of(card, cmd.ref(), false);   // attaching reveals the card
        LogCardRef targetRef = LogCardRef.of(target, cmd.targetRef(), false); // target is always in-play
        String cardToken = cardToken(card);
        String targetToken = cardToken(target);
        target.add(card, false);
        String msg = actor + " attached " + cardToken + " to " + targetToken;
        return new CommandResult(game, msg, new CommandLogData.AttachCardLog(actor, cardRef, targetRef));
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

    private CommandResult handleAddCounter(GameData game, AddCounter cmd, String actor) {
        CardData card = game.getCardByRef(cmd.ref());
        if (card == null) return CommandResult.silent(game);
        LogCardRef logRef = LogCardRef.of(card, cmd.ref(), isHidden(card));
        card.setCounters(card.getCounters() + cmd.amount());
        String msg = actor + " added " + cmd.amount() + " counter(s) to " + cardLabel(card, cmd.ref());
        return new CommandResult(game, msg, new CommandLogData.AddCounterLog(actor, logRef, cmd.amount()));
    }

    private CommandResult handleRemoveCounter(GameData game, RemoveCounter cmd, String actor) {
        CardData card = game.getCardByRef(cmd.ref());
        if (card == null) return CommandResult.silent(game);
        LogCardRef logRef = LogCardRef.of(card, cmd.ref(), isHidden(card));
        card.setCounters(Math.max(0, card.getCounters() - cmd.amount()));
        String msg = actor + " removed " + cmd.amount() + " counter(s) from " + cardLabel(card, cmd.ref());
        return new CommandResult(game, msg, new CommandLogData.RemoveCounterLog(actor, logRef, cmd.amount()));
    }

    private void handleSetCardNotes(GameData game, SetCardNotes cmd) {
        CardData card = game.getCardByRef(cmd.ref());
        if (card != null) card.setNotes(cmd.notes());
    }

    // ── Pool / edge ───────────────────────────────────────────────────────────

    private CommandResult handleSetPool(GameData game, SetPool cmd, String actor) {
        PlayerData player = game.getPlayer(cmd.playerName());
        if (player == null) return CommandResult.silent(game);
        player.setPool(cmd.amount());
        String msg = actor + " set " + cmd.playerName() + "'s pool to " + cmd.amount();
        return new CommandResult(game, msg, new CommandLogData.SetPoolLog(actor, cmd.playerName(), cmd.amount()));
    }

    private CommandResult handleGainEdge(GameData game, GainEdge cmd, String actor) {
        PlayerData player = game.getPlayer(cmd.playerName());
        game.setEdge(player);
        String msg = actor + " gained the Edge";
        return new CommandResult(game, msg, new CommandLogData.GainEdgeLog(actor));
    }

    // ── Influence / crypt ─────────────────────────────────────────────────────

    private CommandResult handleTransferBlood(GameData game, TransferBlood cmd, String actor) {
        CardData card = game.getCardByRef(cmd.ref());
        if (card == null) return CommandResult.silent(game);
        PlayerData controller = card.getController();
        if (controller == null) return CommandResult.silent(game);
        LogCardRef logRef = LogCardRef.of(card, cmd.ref(), isHidden(card));
        int amount = cmd.amount();

        // Transfers to/from UNCONTROLLED vampires are only valid during the current player's
        // influence phase and consume the transfer budget.
        // Pool → card costs 1 transfer per blood; card → pool costs 2 transfers per blood.
        if (cmd.ref().regionType() == RegionType.UNCONTROLLED) {
            if (game.getPhase() != Phase.INFLUENCE) return CommandResult.silent(game);
            if (!actor.equals(game.getCurrentPlayerName())) return CommandResult.silent(game);
            int cost = amount > 0 ? amount : Math.abs(amount) * 2;
            if (game.getTransfersRemaining() < cost) return CommandResult.silent(game);
            game.setTransfersRemaining(game.getTransfersRemaining() - cost);
        }

        // positive = pool → card, negative = card → pool
        controller.setPool(Math.max(0, controller.getPool() - amount));
        card.setCounters(Math.max(0, card.getCounters() + amount));
        String label = cardLabel(card, cmd.ref());
        String msg = amount > 0
                ? actor + " transferred " + amount + " blood to " + label
                : actor + " transferred " + Math.abs(amount) + " blood from " + label;
        return new CommandResult(game, msg, new CommandLogData.TransferBloodLog(actor, logRef, amount));
    }

    private CommandResult handleInfluenceCard(GameData game, InfluenceCard cmd, String actor) {
        if (cmd.ref().regionType() != RegionType.UNCONTROLLED) return CommandResult.silent(game);
        if (game.getPhase() != Phase.INFLUENCE) return CommandResult.silent(game);
        if (!actor.equals(game.getCurrentPlayerName())) return CommandResult.silent(game);
        CardData card = game.getCardByRef(cmd.ref());
        if (card == null) return CommandResult.silent(game);
        if (card.getCapacity() <= 0 || card.getCounters() < card.getCapacity()) return CommandResult.silent(game);
        LogCardRef logRef = LogCardRef.of(card, cmd.ref(), false);
        String token = cardToken(card);
        PlayerData owner = card.getOwner();
        if (owner == null) return CommandResult.silent(game);
        owner.getRegion(RegionType.READY).addCard(card, false);
        String msg = actor + " moved " + token + " to the Ready region";
        return new CommandResult(game, msg, new CommandLogData.InfluenceCardLog(actor, logRef));
    }

    private CommandResult handleMoveToCrypt(GameData game, MoveToCrypt cmd, String actor) {
        CardData card = game.getCardByRef(cmd.ref());
        if (card == null) return CommandResult.silent(game);
        LogCardRef logRef = LogCardRef.of(card, cmd.ref(), false);
        String token = cardToken(card);
        PlayerData owner = card.getOwner();
        if (owner == null) return CommandResult.silent(game);
        card.setCounters(0);
        owner.getRegion(RegionType.CRYPT).addCard(card, false);
        String msg = actor + " returned " + token + " to the Crypt";
        return new CommandResult(game, msg, new CommandLogData.MoveToCryptLog(actor, logRef));
    }

    // ── Minion state ──────────────────────────────────────────────────────────

    private CommandResult handleMoveToTorpor(GameData game, MoveToTorpor cmd, String actor) {
        CardData card = game.getCardByRef(cmd.ref());
        if (card == null) return CommandResult.silent(game);
        LogCardRef logRef = LogCardRef.of(card, cmd.ref(), false);
        String token = cardToken(card);
        PlayerData owner = card.getOwner();
        if (owner == null) return CommandResult.silent(game);
        owner.getRegion(RegionType.TORPOR).addCard(card, false);
        String msg = actor + " sent " + token + " to Torpor";
        return new CommandResult(game, msg, new CommandLogData.MoveToTorporLog(actor, logRef));
    }

    private CommandResult handleRescueFromTorpor(GameData game, RescueFromTorpor cmd, String actor) {
        CardData card = game.getCardByRef(cmd.ref());
        if (card == null) return CommandResult.silent(game);
        LogCardRef logRef = LogCardRef.of(card, cmd.ref(), false);
        String token = cardToken(card);
        PlayerData owner = card.getOwner();
        if (owner == null) return CommandResult.silent(game);
        owner.getRegion(RegionType.READY).addCard(card, false);
        String msg = actor + " rescued " + token + " from Torpor";
        return new CommandResult(game, msg, new CommandLogData.RescueFromTorporLog(actor, logRef));
    }

    private CommandResult handleBurnMinion(GameData game, BurnMinion cmd, String actor) {
        CardData card = game.getCardByRef(cmd.ref());
        if (card == null) return CommandResult.silent(game);
        LogCardRef logRef = LogCardRef.of(card, cmd.ref(), false);
        String token = cardToken(card);
        PlayerData owner = card.getOwner();
        if (owner == null) return CommandResult.silent(game);
        owner.getRegion(RegionType.ASH_HEAP).addCard(card, false);
        String msg = actor + " burned " + token;
        return new CommandResult(game, msg, new CommandLogData.BurnMinionLog(actor, logRef));
    }

    // ── Contesting / title ────────────────────────────────────────────────────

    private CommandResult handleContestCard(GameData game, ContestCard cmd, String actor) {
        CardData card = game.getCardByRef(cmd.ref());
        if (card == null) return CommandResult.silent(game);
        LogCardRef logRef = LogCardRef.of(card, cmd.ref(), false);
        card.setContested(true);
        String msg = actor + " contested " + cardToken(card);
        return new CommandResult(game, msg, new CommandLogData.ContestCardLog(actor, logRef));
    }

    private CommandResult handleClearContestCard(GameData game, ClearContestCard cmd, String actor) {
        CardData card = game.getCardByRef(cmd.ref());
        if (card == null) return CommandResult.silent(game);
        LogCardRef logRef = LogCardRef.of(card, cmd.ref(), false);
        card.setContested(false);
        String msg = actor + " uncontested " + cardToken(card);
        return new CommandResult(game, msg, new CommandLogData.ClearContestCardLog(actor, logRef));
    }

    private CommandResult handleSetTitle(GameData game, SetTitle cmd, String actor) {
        CardData card = game.getCardByRef(cmd.ref());
        if (card == null) return CommandResult.silent(game);
        LogCardRef logRef = LogCardRef.of(card, cmd.ref(), false);
        card.setTitle(cmd.title());
        String msg = actor + " set " + cardToken(card) + "'s title to " + cmd.title();
        return new CommandResult(game, msg, new CommandLogData.SetTitleLog(actor, logRef, cmd.title()));
    }

    // ── Player ────────────────────────────────────────────────────────────────

    private CommandResult handleOustPlayer(GameData game, OustPlayer cmd, String actor) {
        PlayerData ousted = game.getPlayer(cmd.playerName());
        if (ousted == null) return CommandResult.silent(game);
        ousted.setPool(0);

        PlayerData predator = ousted.getPredator();
        if (predator != null) {
            predator.addVictoryPoints(1.0f);
            predator.setPool(predator.getPool() + 6);
        }

        // Rebuild predator-prey ring excluding ousted players
        game.updatePredatorMapping();

        // If the ousted player was the current player, advance the turn
        if (cmd.playerName().equals(game.getCurrentPlayerName())) {
            handleNextTurn(game, new NextTurn(cmd.gameId()), actor);
        }

        String msg = actor + " ousted " + cmd.playerName();
        return new CommandResult(game, msg, new CommandLogData.OustPlayerLog(actor, cmd.playerName()));
    }

    private void handleSetChoice(GameData game, SetChoice cmd) {
        PlayerData player = game.getPlayer(cmd.playerName());
        if (player != null) player.setChoice(cmd.choice());
    }

    private CommandResult handleReverseOrder(GameData game, ReverseOrder cmd, String actor) {
        game.setOrderOfPlayReversed(!game.isOrderOfPlayReversed());
        String msg = actor + " reversed the order of play";
        return new CommandResult(game, msg, new CommandLogData.ReverseOrderLog(actor));
    }

    private void handleSetGameNotes(GameData game, SetGameNotes cmd) {
        game.setNotes(cmd.notes());
    }

    // ── Impulse / Sequencing ──────────────────────────────────────────────────

    private CommandResult handleOpenImpulseWindow(GameData game, OpenImpulseWindow cmd, String actor) {
        ImpulseState state = new ImpulseState();
        state.setActive(true);
        state.setContext(cmd.context());
        state.setActingPlayer(cmd.actingPlayer());
        state.setCurrentImpulseHolder(cmd.actingPlayer());
        state.setConsecutivePasses(0);
        state.setPassOrder(buildPassOrder(game, cmd.context(), cmd.actingPlayer(), cmd.targetPlayerName()));
        game.setImpulseWindow(state);
        String contextLabel = cmd.context().name().toLowerCase().replace('_', ' ');
        String msg = actor + " opened an impulse window (" + contextLabel + ") — " + cmd.actingPlayer() + " has first impulse";
        return new CommandResult(game, msg, new CommandLogData.OpenImpulseLog(actor, cmd.context().name(), cmd.actingPlayer()));
    }

    private CommandResult handlePassImpulse(GameData game, PassImpulse cmd, String actor) {
        ImpulseState state = game.getImpulseWindow();
        if (state == null || !state.isActive()) return CommandResult.silent(game);
        if (!cmd.playerName().equals(state.getCurrentImpulseHolder())) return CommandResult.silent(game);

        int passes = state.getConsecutivePasses() + 1;
        state.setConsecutivePasses(passes);

        if (passes >= state.getPassOrder().size()) {
            state.setActive(false);
            String msg = actor + " passed — all players have passed; impulse window closes";
            return new CommandResult(game, msg, new CommandLogData.PassImpulseLog(actor));
        }

        List<String> order = state.getPassOrder();
        int idx = order.indexOf(state.getCurrentImpulseHolder());
        state.setCurrentImpulseHolder(order.get((idx + 1) % order.size()));
        String msg = actor + " passed impulse to " + state.getCurrentImpulseHolder();
        return new CommandResult(game, msg, new CommandLogData.PassImpulseLog(actor));
    }

    private CommandResult handleClaimImpulse(GameData game, ClaimImpulse cmd, String actor) {
        ImpulseState state = game.getImpulseWindow();
        if (state == null || !state.isActive()) return CommandResult.silent(game);
        if (!cmd.playerName().equals(state.getCurrentImpulseHolder())) return CommandResult.silent(game);

        state.setConsecutivePasses(0);
        state.setCurrentImpulseHolder(state.getActingPlayer());
        String msg = actor + " used their impulse — impulse returns to " + state.getActingPlayer();
        return new CommandResult(game, msg, new CommandLogData.ClaimImpulseLog(actor));
    }

    private CommandResult handleCloseImpulseWindow(GameData game, CloseImpulseWindow cmd, String actor) {
        ImpulseState state = game.getImpulseWindow();
        if (state != null) state.setActive(false);
        game.setImpulseWindow(null);
        String msg = actor + " closed the impulse window";
        return new CommandResult(game, msg, new CommandLogData.CloseImpulseLog(actor));
    }

    private List<String> buildPassOrder(GameData game, ImpulseContext context, String actingPlayer, String targetPlayerName) {
        List<String> active = game.getCurrentPlayers().stream()
                .map(PlayerData::getName)
                .collect(java.util.stream.Collectors.toList());
        if (!active.contains(actingPlayer)) return List.of(actingPlayer);

        List<String> order = new ArrayList<>();
        order.add(actingPlayer);

        int actingIdx = active.indexOf(actingPlayer);
        int n = active.size();

        PlayerData acting = game.getPlayer(actingPlayer);
        String prey = acting.getPrey() != null ? acting.getPrey().getName() : null;
        String predator = acting.getPredator() != null ? acting.getPredator().getName() : null;

        switch (context) {
            case UNDIRECTED -> {
                if (prey != null && active.contains(prey)) order.add(prey);
                if (predator != null && active.contains(predator)) order.add(predator);
                for (int i = 1; i < n; i++) {
                    String name = active.get((actingIdx + i) % n);
                    if (!order.contains(name)) order.add(name);
                }
            }
            case DIRECTED_SINGLE, COMBAT -> {
                if (targetPlayerName != null && active.contains(targetPlayerName)) order.add(targetPlayerName);
                for (int i = 1; i < n; i++) {
                    String name = active.get((actingIdx + i) % n);
                    if (!order.contains(name)) order.add(name);
                }
            }
            case DIRECTED_MULTI -> {
                for (int i = 1; i < n; i++) {
                    String name = active.get((actingIdx + i) % n);
                    if (!order.contains(name)) order.add(name);
                }
            }
        }
        return order;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static String cardToken(CardData card) {
        return "[card:" + card.getCardId() + ":" + card.getName() + "]";
    }

    /** Returns a log-safe label for a card: masks identity when the card is in a region hidden from opponents. */
    private String cardLabel(CardData card, CardRef ref) {
        RegionData region = card.getRegion();
        if (region == null) return cardToken(card);
        RegionType type = region.getType();
        String ownerName = card.getOwner() != null ? card.getOwner().getName() : "unknown";
        if (type == RegionType.UNCONTROLLED) {
            return "card #" + (ref.position() + 1) + " in " + ownerName + "'s uncontrolled region";
        }
        if (RegionType.OTHER_HIDDEN_REGIONS.contains(type)) {
            return "a card in " + ownerName + "'s " + type.description();
        }
        return cardToken(card);
    }

    private boolean isHidden(CardData card) {
        RegionData region = card.getRegion();
        if (region == null) return false;
        RegionType type = region.getType();
        return type == RegionType.UNCONTROLLED || RegionType.OTHER_HIDDEN_REGIONS.contains(type);
    }

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

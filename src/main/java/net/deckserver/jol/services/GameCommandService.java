package net.deckserver.jol.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import net.deckserver.jol.entity.Game;
import net.deckserver.jol.enums.ImpulseContext;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.ImpulseState;
import net.deckserver.jol.game.command.*;
import net.deckserver.jol.services.handler.*;
import org.jboss.logging.Logger;

import java.util.Set;

@ApplicationScoped
public class GameCommandService {

    private static final Logger LOG = Logger.getLogger(GameCommandService.class);

    @Inject
    GameStateStore store;

    @Inject
    ObjectMapper mapper;

    /**
     * Validates, applies the command to the in-memory game state, persists a snapshot,
     * and returns the result including an optional structured log entry.
     * Synchronized on the GameData instance so concurrent commands for the same game are serialized.
     * Throws GameRuleException if a rule precondition fails — callers should convert this to an error response.
     */
    @Transactional
    public CommandResult execute(String actorUsername, GameCommand command) {
        GameData game = store.get(command.gameId());
        if (game == null) {
            throw new IllegalStateException("Game not active: " + command.gameId());
        }
        CommandResult result;
        synchronized (game) {
            result = dispatch(game, command, actorUsername);
            persistSnapshot(command.gameId(), result.game());
        }
        return result;
    }

    // ── Dispatch ─────────────────────────────────────────────────────────────

    private static final Set<Class<? extends GameCommand>> IMPULSE_EXEMPT = Set.of(
        AdvancePhase.class, NextTurn.class,
        OpenImpulseWindow.class, PassImpulse.class, ClaimImpulse.class, CloseImpulseWindow.class,
        SetGameNotes.class, SetCardNotes.class, SetChoice.class
    );

    private CommandResult dispatch(GameData game, GameCommand cmd, String actor) {
        ImpulseState impulse = game.getImpulseWindow();
        if (impulse != null && impulse.isActive() && !IMPULSE_EXEMPT.contains(cmd.getClass())) {
            if (!actor.equals(impulse.getCurrentImpulseHolder())) {
                throw new net.deckserver.jol.exception.GameRuleException(
                        "It is not your impulse — " + impulse.getCurrentImpulseHolder() + " holds the impulse");
            }
        }
        return switch (cmd) {
            case AdvancePhase c         -> TurnPhaseHandler.handleAdvancePhase(game, c, actor);
            case NextTurn c             -> TurnPhaseHandler.handleNextTurn(game, c, actor);
            case DrawCard c             -> DeckHandler.handleDrawCard(game, c, actor);
            case DrawCrypt c            -> DeckHandler.handleDrawCrypt(game, c, actor);
            case ShuffleLibrary c       -> DeckHandler.handleShuffleLibrary(game, actor);
            case ShuffleCrypt c         -> DeckHandler.handleShuffleCrypt(game, actor);
            case DiscardCard c          -> CardMovementHandler.handleDiscardCard(game, c, actor);
            case PlayCard c             -> CardMovementHandler.handlePlayCard(game, c, actor);
            case MoveCard c             -> CardMovementHandler.handleMoveCard(game, c, actor);
            case AttachCard c           -> CardMovementHandler.handleAttachCard(game, c, actor);
            case LockCard c             -> CardStateHandler.handleLockCard(game, c);
            case UnlockCard c           -> CardStateHandler.handleUnlockCard(game, c);
            case UnlockAll c            -> CardStateHandler.handleUnlockAll(game, c);
            case AddCounter c           -> CardStateHandler.handleAddCounter(game, c, actor);
            case RemoveCounter c        -> CardStateHandler.handleRemoveCounter(game, c, actor);
            case SetCardNotes c         -> CardStateHandler.handleSetCardNotes(game, c);
            case SetPool c              -> PoolEdgeHandler.handleSetPool(game, c, actor);
            case GainEdge c             -> PoolEdgeHandler.handleGainEdge(game, c, actor);
            case TransferBlood c        -> InfluenceHandler.handleTransferBlood(game, c, actor);
            case InfluenceCard c        -> InfluenceHandler.handleInfluenceCard(game, c, actor);
            case MoveToCrypt c          -> InfluenceHandler.handleMoveToCrypt(game, c, actor);
            case MoveToTorpor c         -> MinionHandler.handleMoveToTorpor(game, c, actor);
            case RescueFromTorpor c     -> MinionHandler.handleRescueFromTorpor(game, c, actor);
            case BurnMinion c           -> MinionHandler.handleBurnMinion(game, c, actor);
            case ContestCard c          -> ContestHandler.handleContestCard(game, c, actor);
            case ClearContestCard c     -> ContestHandler.handleClearContestCard(game, c, actor);
            case SetTitle c             -> ContestHandler.handleSetTitle(game, c, actor);
            case OustPlayer c           -> PlayerHandler.handleOustPlayer(game, c, actor);
            case SetChoice c            -> PlayerHandler.handleSetChoice(game, c);
            case ReverseOrder c         -> PlayerHandler.handleReverseOrder(game, c, actor);
            case SetGameNotes c         -> PlayerHandler.handleSetGameNotes(game, c);
            case OpenImpulseWindow c    -> ImpulseHandler.handleOpenImpulseWindow(game, c, actor);
            case PassImpulse c          -> ImpulseHandler.handlePassImpulse(game, c, actor);
            case ClaimImpulse c         -> ImpulseHandler.handleClaimImpulse(game, c, actor);
            case CloseImpulseWindow c   -> ImpulseHandler.handleCloseImpulseWindow(game, c, actor);
        };
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

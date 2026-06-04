package net.deckserver.jol.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import net.deckserver.jol.entity.Game;
import net.deckserver.jol.enums.Status;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.ImpulseState;
import net.deckserver.jol.game.SequencingWindowState;
import net.deckserver.jol.game.command.*;
import net.deckserver.jol.game.effect.GameEffectApplicator;
import net.deckserver.jol.services.handler.*;
import org.jboss.logging.Logger;

import java.util.List;
import java.util.Objects;

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
            if (game.isCompleted()) {
                throw new net.deckserver.jol.exception.GameRuleException("This game has already ended");
            }
            CommandResult raw = dispatch(game, command, actorUsername);
            List<String> effectLogs = raw.effects().stream()
                    .map(e -> GameEffectApplicator.apply(game, e))
                    .filter(Objects::nonNull)
                    .toList();
            result = new CommandResult(game, raw.logMessage(), raw.commandLog(), raw.effects(), effectLogs);
            persistSnapshot(command.gameId(), result.game());
            if (result.game().isCompleted()) {
                finishGame(command.gameId());
            }
        }
        return result;
    }

    // ── Dispatch ─────────────────────────────────────────────────────────────

    private CommandResult dispatch(GameData game, GameCommand cmd, String actor) {
        // Mode enforcement — applied before impulse/sequencing checks
        if (game.isRulesEnforced() && isPermissiveOnly(cmd)) {
            throw new net.deckserver.jol.exception.GameRuleException(
                    "This command is not available in rules-enforced mode");
        }
        if (!game.isRulesEnforced() && isEnforcedOnly(cmd)) {
            throw new net.deckserver.jol.exception.GameRuleException(
                    "This command is not available in permissive mode");
        }

        ImpulseState impulse = game.getImpulseWindow();
        if (impulse != null && impulse.isActive() && !cmd.isImpulseExempt()) {
            if (!actor.equals(impulse.getCurrentImpulseHolder())) {
                throw new net.deckserver.jol.exception.GameRuleException(
                        "It is not your impulse — " + impulse.getCurrentImpulseHolder() + " holds the impulse");
            }
        }
        SequencingWindowState seq = game.getSequencingWindow();
        if (seq != null && seq.isActive() && !cmd.isSequencingExempt()) {
            if (!actor.equals(seq.getCurrentHolder())) {
                throw new net.deckserver.jol.exception.GameRuleException(
                        "It is not your sequencing priority — " + seq.getCurrentHolder() + " holds priority");
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
            case UnlockAll c            -> CardStateHandler.handleUnlockAll(game, c, actor);
            case AddCounter c           -> CardStateHandler.handleAddCounter(game, c, actor);
            case RemoveCounter c        -> CardStateHandler.handleRemoveCounter(game, c, actor);
            case SetCardNotes c         -> CardStateHandler.handleSetCardNotes(game, c);
            case SetPool c              -> PoolEdgeHandler.handleSetPool(game, c, actor);
            case GainEdge c             -> PoolEdgeHandler.handleGainEdge(game, c, actor);
            case TransferBlood c            -> InfluenceHandler.handleTransferBlood(game, c, actor);
            case InfluenceCard c            -> InfluenceHandler.handleInfluenceCard(game, c, actor);
            case MoveToCrypt c              -> InfluenceHandler.handleMoveToCrypt(game, c, actor);
            case DrawCryptToUncontrolled c  -> InfluenceHandler.handleDrawCryptToUncontrolled(game, c, actor);
            case MergeAdvanced c            -> InfluenceHandler.handleMergeAdvanced(game, c, actor);
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
            case DeclareAction c        -> ActionHandler.handleDeclareAction(game, c, actor);
            case AttemptBlock c         -> ActionHandler.handleAttemptBlock(game, c, actor);
            case ResolveAction c        -> ActionHandler.handleResolveAction(game, c, actor);
            case AbortAction c          -> ActionHandler.handleAbortAction(game, c, actor);
            case PassSequencing c       -> SequencingHandler.handlePassSequencing(game, c, actor);
            case CloseSequencingWindow c -> SequencingHandler.handleCloseSequencingWindow(game, c, actor);
            case SetRulesMode c         -> {
                String label = c.enforced() ? "rules-enforced" : "permissive";
                yield new CommandResult(game, actor + " switched the game to " + label + " mode",
                        new net.deckserver.jol.game.command.CommandLogData.SetRulesModeLog(actor, c.enforced()),
                        List.of(new net.deckserver.jol.game.effect.GameModeChangedEffect(c.enforced())));
            }
        };
    }

    private static boolean isPermissiveOnly(GameCommand command) {
        return command instanceof MoveCard || command instanceof DrawCard || command instanceof DrawCrypt
                || command instanceof DrawCryptToUncontrolled || command instanceof DiscardCard
                || command instanceof PlayCard || command instanceof AttachCard
                || command instanceof SetPool || command instanceof GainEdge
                || command instanceof TransferBlood || command instanceof InfluenceCard
                || command instanceof MoveToCrypt || command instanceof MoveToTorpor
                || command instanceof RescueFromTorpor || command instanceof BurnMinion
                || command instanceof MergeAdvanced || command instanceof OustPlayer
                || command instanceof AdvancePhase || command instanceof NextTurn;
    }

    private static boolean isEnforcedOnly(GameCommand command) {
        return command instanceof OpenImpulseWindow || command instanceof CloseImpulseWindow
                || command instanceof PassImpulse || command instanceof ClaimImpulse
                || command instanceof DeclareAction || command instanceof AttemptBlock
                || command instanceof ResolveAction || command instanceof AbortAction
                || command instanceof PassSequencing || command instanceof CloseSequencingWindow;
    }

    private void persistSnapshot(String gameId, GameData gameData) {
        try {
            Game game = Game.findById(gameId);
            if (game != null) {
                game.gameState = mapper.writeValueAsString(gameData);
            }
        } catch (Exception e) {
            LOG.errorf(e, "Failed to persist game snapshot for %s", gameId);
            throw new IllegalStateException("Failed to save game state for " + gameId, e);
        }
    }

    private void finishGame(String gameId) {
        store.remove(gameId);
        Game entity = Game.findById(gameId);
        if (entity != null) {
            entity.status = Status.FINISHED;
        }
    }
}

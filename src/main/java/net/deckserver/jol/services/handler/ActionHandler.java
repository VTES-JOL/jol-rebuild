package net.deckserver.jol.services.handler;

import net.deckserver.jol.enums.ActionStatus;
import net.deckserver.jol.enums.ImpulseContext;
import net.deckserver.jol.enums.Phase;
import net.deckserver.jol.enums.RegionType;
import net.deckserver.jol.enums.SequencingWindowType;
import net.deckserver.jol.exception.GameRuleException;
import net.deckserver.jol.game.CardData;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.ImpulseState;
import net.deckserver.jol.game.PendingActionState;
import net.deckserver.jol.game.SequencingWindowState;
import net.deckserver.jol.game.command.*;
import net.deckserver.jol.game.effect.*;
import net.deckserver.jol.services.CommandResult;
import net.deckserver.jol.services.GameRules;

import java.util.ArrayList;
import java.util.List;

public final class ActionHandler {
    private ActionHandler() {}

    public static CommandResult handleDeclareAction(GameData game, DeclareAction cmd, String actor) {
        GameRules.requirePhase(game, Phase.MINION);
        GameRules.requireCurrentPlayer(game, actor);

        if (game.getPendingAction() != null) {
            throw new GameRuleException("An action is already in progress");
        }

        CardData actorCard = GameRules.requireCard(game, cmd.actorRef());
        GameRules.requireCardInRegion(actorCard, RegionType.READY);
        if (!actorCard.isMinion()) {
            throw new GameRuleException("Only minions can declare actions");
        }
        if (actorCard.isLocked()) {
            throw new GameRuleException("A locked minion cannot declare an action");
        }
        if (!actor.equals(actorCard.getOwnerName())) {
            throw new GameRuleException("You do not control this minion");
        }

        PendingActionState pending = new PendingActionState();
        pending.setActorRef(cmd.actorRef());
        pending.setActionType(cmd.actionType());
        pending.setTargetPlayerName(cmd.targetPlayerName());
        pending.setStatus(ActionStatus.DURING_ACTION);

        ImpulseContext context = cmd.targetPlayerName() != null
                ? ImpulseContext.DIRECTED_SINGLE
                : ImpulseContext.UNDIRECTED;
        ImpulseState impulse = new ImpulseState();
        impulse.setActive(true);
        impulse.setContext(context);
        impulse.setActingPlayer(actor);
        impulse.setCurrentImpulseHolder(actor);
        impulse.setConsecutivePasses(0);
        impulse.setPassOrder(HandlerUtils.buildPassOrder(game, context, actor, cmd.targetPlayerName()));

        String actionLabel = cmd.actionType().name().toLowerCase().replace('_', ' ');
        String targetSuffix = cmd.targetPlayerName() != null ? " targeting " + cmd.targetPlayerName() : "";
        String msg = actor + " declared a " + actionLabel + " action" + targetSuffix;
        return new CommandResult(game, msg,
                new CommandLogData.DeclareActionLog(actor, cmd.actionType().name(), actorCard.getName()),
                List.of(new CardLockedEffect(actorCard.getId(), true),
                        new PendingActionChangedEffect(true, pending),
                        new ImpulseWindowChangedEffect(true, impulse)));
    }

    public static CommandResult handleAttemptBlock(GameData game, AttemptBlock cmd, String actor) {
        PendingActionState pending = game.getPendingAction();
        if (pending == null || pending.getStatus() != ActionStatus.DURING_ACTION) {
            throw new GameRuleException("No action in progress to block");
        }

        CardData blocker = GameRules.requireCard(game, cmd.blockerRef());
        GameRules.requireCardInRegion(blocker, RegionType.READY);
        if (!blocker.isMinion()) {
            throw new GameRuleException("Only minions can block");
        }
        if (blocker.isLocked()) {
            throw new GameRuleException("A locked minion cannot block");
        }
        if (!actor.equals(blocker.getOwnerName())) {
            throw new GameRuleException("You do not control this minion");
        }
        String actingPlayer = pending.getActorRef() != null ? pending.getActorRef().playerName() : null;
        if (actor.equals(actingPlayer)) {
            throw new GameRuleException("The acting player cannot block their own action");
        }

        PendingActionState updated = pending.withStatus(ActionStatus.BLOCKED);
        updated.setBlockerRef(cmd.blockerRef());

        String msg = actor + " blocked with " + blocker.getName() + " — impulse window closed";
        return new CommandResult(game, msg,
                new CommandLogData.AttemptBlockLog(actor, blocker.getName()),
                List.of(new CardLockedEffect(blocker.getId(), true),
                        new PendingActionChangedEffect(true, updated),
                        new ImpulseWindowChangedEffect(false)));
    }

    public static CommandResult handleResolveAction(GameData game, ResolveAction cmd, String actor) {
        PendingActionState pending = game.getPendingAction();
        if (pending == null || pending.getStatus() != ActionStatus.DURING_ACTION) {
            throw new GameRuleException("No unblocked action in progress to resolve");
        }
        ImpulseState impulse = game.getImpulseWindow();
        if (impulse != null && impulse.isActive()) {
            throw new GameRuleException("The impulse window must close before the action can be resolved");
        }

        PendingActionState resolved = pending.withStatus(ActionStatus.AFTER_RESOLUTION);

        String actingPlayer = pending.getActorRef() != null ? pending.getActorRef().playerName() : actor;
        List<String> passOrder = HandlerUtils.buildPassOrder(game, ImpulseContext.UNDIRECTED, actingPlayer, null);

        SequencingWindowState seq = new SequencingWindowState();
        seq.setActive(true);
        seq.setWindowType(SequencingWindowType.AFTER_RESOLUTION);
        seq.setPassOrder(passOrder);
        seq.setConsecutivePasses(0);
        seq.setCurrentHolder(actingPlayer);

        String msg = actor + " resolved the action — after-resolution sequencing window is open";
        return new CommandResult(game, msg, new CommandLogData.ResolveActionLog(actor),
                List.of(new PendingActionChangedEffect(true, resolved),
                        new SequencingWindowChangedEffect(true, seq)));
    }

    public static CommandResult handleAbortAction(GameData game, AbortAction cmd, String actor) {
        PendingActionState pending = game.getPendingAction();
        if (pending == null) {
            throw new GameRuleException("No action in progress to abort");
        }

        List<GameEffect> effects = new ArrayList<>();
        if (pending.getActorRef() != null) {
            CardData actorCard = game.getCardByRef(pending.getActorRef());
            if (actorCard != null) effects.add(new CardLockedEffect(actorCard.getId(), false));
        }
        effects.add(new PendingActionChangedEffect(false));
        effects.add(new ImpulseWindowChangedEffect(false));
        effects.add(new SequencingWindowChangedEffect(false));

        String msg = actor + " aborted the action";
        return new CommandResult(game, msg, new CommandLogData.AbortActionLog(actor), effects);
    }
}

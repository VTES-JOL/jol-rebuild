package net.deckserver.jol.services.handler;

import net.deckserver.jol.enums.*;
import net.deckserver.jol.exception.GameRuleException;
import net.deckserver.jol.game.*;
import net.deckserver.jol.game.command.*;
import net.deckserver.jol.game.effect.*;
import net.deckserver.jol.services.CommandResult;
import net.deckserver.jol.services.GameRules;

import java.util.ArrayList;
import java.util.List;

public final class CardMovementHandler {
    private CardMovementHandler() {}

    static final int MAX_HAND_SIZE = 7;

    public static CommandResult handleDiscardCard(GameData game, DiscardCard cmd, String actor) {
        CardData card = GameRules.requireCard(game, cmd.ref());
        LogCardRef logRef = LogCardRef.of(card, cmd.ref(), false);
        String token = HandlerUtils.cardToken(card);
        PlayerData owner = GameRules.requireOwner(card);
        String msg = actor + " discarded " + token;
        return new CommandResult(game, msg, new CommandLogData.DiscardCardLog(actor, logRef),
                List.of(new CardMovedEffect(card.getId(), owner.getName(), RegionType.ASH_HEAP.name(), 0)));
    }

    public static CommandResult handlePlayCard(GameData game, PlayCard cmd, String actor) {
        CardData card = GameRules.requireCard(game, cmd.ref());
        boolean hiddenInTarget = cmd.targetRegionType() != null && !cmd.targetRegionType().otherVisibility();
        LogCardRef logRef = LogCardRef.of(card, cmd.ref(), hiddenInTarget);
        String token = HandlerUtils.cardToken(card);

        if (!game.isRulesEnforced()) {
            // Permissive: simple card movement
            if (cmd.targetPlayerName() == null || cmd.targetRegionType() == null) {
                PlayerData owner = card.getOwner();
                String targetPlayer = owner != null ? owner.getName() : actor;
                String msg = actor + " played " + token;
                return new CommandResult(game, msg, new CommandLogData.PlayCardLog(actor, logRef),
                        List.of(new CardMovedEffect(card.getId(), targetPlayer, RegionType.ASH_HEAP.name())));
            }
            GameRules.requirePlayer(game, cmd.targetPlayerName());
            String msg = actor + " played " + token;
            return new CommandResult(game, msg, new CommandLogData.PlayCardLog(actor, logRef),
                    List.of(new CardMovedEffect(card.getId(), cmd.targetPlayerName(), cmd.targetRegionType().name())));
        }

        // ── Enforced mode ─────────────────────────────────────────────────────

        // Guard 1: Source region
        RegionData sourceRegion = card.getRegion();
        if (sourceRegion == null || !RegionType.PLAYABLE_REGIONS.contains(sourceRegion.getType())) {
            throw new GameRuleException("Card must be played from hand or research area");
        }

        // Guard 2: Resolve effective type
        CardType effectiveType = resolveEffectiveType(card, cmd.playAsType());

        // Guard 3: Phase gate
        enforcePhaseForType(game, effectiveType);

        // Guard 4: Actor/context gate
        PendingActionState pending = game.getPendingAction();
        enforceActorForType(game, effectiveType, actor, pending);

        // Guard 5: ACTION limbo gate (only one action card per action)
        if (effectiveType == CardType.ACTION) {
            if (pending == null || pending.getStatus() != ActionStatus.DURING_ACTION) {
                throw new GameRuleException("Action cards can only be played while an action is in progress");
            }
            if (pending.getActionCardId() != null) {
                throw new GameRuleException("An action card is already in play for this action");
            }
        }

        // Build effects
        List<GameEffect> effects = new ArrayList<>();
        PlayerData owner = card.getOwner();
        String ownerName = owner != null ? owner.getName() : actor;

        // Move card out of hand to ASH_HEAP (ACTION cards are tracked via actionCardId; their ASH_HEAP placement is limbo)
        effects.add(new CardMovedEffect(card.getId(), ownerName, RegionType.ASH_HEAP.name()));

        // For ACTION cards, record limbo in pending action state
        if (effectiveType == CardType.ACTION && pending != null) {
            PendingActionState updated = new PendingActionState(pending);
            updated.setActionCardId(card.getId());
            effects.add(new PendingActionChangedEffect(true, updated));
        }

        // Open CARD_AS_PLAYED sequencing window
        CardPlayState cps = new CardPlayState(card.getId(), effectiveType, actor);
        effects.add(new CardPlayChangedEffect(true, cps));

        // Mirror the pending action's direction so the target player retains priority in directed actions.
        ImpulseContext cardContext = (pending != null && pending.getTargetPlayerName() != null)
                ? ImpulseContext.DIRECTED_SINGLE
                : ImpulseContext.UNDIRECTED;
        String cardTarget = (pending != null) ? pending.getTargetPlayerName() : null;
        List<String> passOrder = ImpulseEngine.buildPassOrder(game, cardContext, actor, cardTarget);
        SequencingWindowState seq = new SequencingWindowState();
        seq.setActive(true);
        seq.setWindowType(SequencingWindowType.CARD_AS_PLAYED);
        seq.setPassOrder(passOrder);
        seq.setConsecutivePasses(0);
        seq.setCurrentHolder(actor);
        effects.add(new SequencingWindowChangedEffect(true, seq));

        String msg = actor + " played " + token;
        return new CommandResult(game, msg, new CommandLogData.PlayCardLog(actor, logRef), effects);
    }

    public static CommandResult handleMoveCard(GameData game, MoveCard cmd, String actor) {
        CardData card = GameRules.requireCard(game, cmd.ref());
        RegionData sourceRegion = card.getRegion();
        boolean sourceVisible = sourceRegion != null && sourceRegion.getType().otherVisibility();
        boolean destVisible = cmd.targetRegionType().otherVisibility();
        boolean hidden = !(sourceVisible || destVisible);
        LogCardRef logRef = LogCardRef.of(card, cmd.ref(), hidden);
        String label = hidden ? HandlerUtils.cardLabel(card, cmd.ref()) : HandlerUtils.cardToken(card);
        GameRules.requirePlayer(game, cmd.targetPlayerName());
        String msg = actor + " moved " + label + " to " + cmd.targetPlayerName() + "'s " + cmd.targetRegionType().description();
        return new CommandResult(game, msg,
                new CommandLogData.MoveCardLog(actor, logRef, cmd.targetPlayerName(), cmd.targetRegionType().name()),
                List.of(new CardMovedEffect(card.getId(), cmd.targetPlayerName(), cmd.targetRegionType().name(), cmd.position())));
    }

    public static CommandResult handleAttachCard(GameData game, AttachCard cmd, String actor) {
        CardData card = GameRules.requireCard(game, cmd.ref());
        CardData target = GameRules.requireCard(game, cmd.targetRef());
        LogCardRef cardRef = LogCardRef.of(card, cmd.ref(), false);
        LogCardRef targetRef = LogCardRef.of(target, cmd.targetRef(), false);
        String cardToken = HandlerUtils.cardToken(card);
        String targetToken = HandlerUtils.cardToken(target);
        String msg = actor + " attached " + cardToken + " to " + targetToken;
        return new CommandResult(game, msg, new CommandLogData.AttachCardLog(actor, cardRef, targetRef),
                List.of(new CardAttachedEffect(card.getId(), target.getId())));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    static CardType resolveEffectiveType(CardData card, CardType playAsType) {
        if (playAsType != null) return playAsType;
        List<CardType> types = card.getTypes();
        if (types != null && !types.isEmpty()) {
            return types.getFirst();
        }
        return card.getType();
    }

    private static void enforcePhaseForType(GameData game, CardType effectiveType) {
        Phase phase = game.getPhase();
        boolean legal = switch (effectiveType) {
            case MASTER     -> phase == Phase.MASTER;
            case EVENT      -> phase == Phase.DISCARD;
            case CONVICTION -> phase == Phase.UNLOCK;
            case COMBAT     -> false; // no combat state yet
            default         -> phase == Phase.MINION; // ACTION, MODIFIER, REACTION, ALLY, RETAINER, POLITICAL, EQUIPMENT, POWER
        };
        if (!legal) {
            throw new GameRuleException(
                    effectiveType.name() + " cards cannot be played during the " + phase.getDescription() + " phase");
        }
    }

    private static void enforceActorForType(GameData game, CardType effectiveType, String actor, PendingActionState pending) {
        String currentPlayer = game.getCurrentPlayerName();

        switch (effectiveType) {
            case MODIFIER, REACTION -> {
                if (pending == null || pending.getStatus() != ActionStatus.DURING_ACTION) {
                    throw new GameRuleException(effectiveType == CardType.MODIFIER
                            ? "Modifier cards can only be played during an active action"
                            : "Reaction cards can only be played during an active action");
                }
                CardData actorCard = game.getCardByRef(pending.getActorRef());
                String actingPlayer = actorCard != null ? actorCard.getOwnerName() : null;
                if (effectiveType == CardType.MODIFIER) {
                    if (!actor.equals(actingPlayer)) {
                        throw new GameRuleException("Modifier cards can only be played by the acting player");
                    }
                } else {
                    if (actor.equals(actingPlayer)) {
                        throw new GameRuleException("Reaction cards cannot be played by the acting player");
                    }
                    // CANNOT_REACT restriction check: deferred until PlayCard carries a minionRef
                }
            }
            default -> {
                if (!actor.equals(currentPlayer)) {
                    throw new GameRuleException("Only the current player may play " + effectiveType.name() + " cards");
                }
            }
        }
    }
}

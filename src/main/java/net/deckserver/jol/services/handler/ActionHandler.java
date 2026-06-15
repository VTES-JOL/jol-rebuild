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
import java.util.Set;

public final class ActionHandler {
    private ActionHandler() {}

    public static CommandResult handleDeclareAction(GameData game, DeclareAction cmd, String actor) {
        GameRules.requirePhase(game, Phase.MINION);
        GameRules.requireCurrentPlayer(game, actor);

        if (game.getPendingAction() != null) {
            throw new GameRuleException("An action is already in progress");
        }

        CardData actorCard;
        if (cmd.actionType() == ActionType.LEAVE_TORPOR) {
            actorCard = GameRules.requireCard(game, cmd.actorRef());
            GameRules.requireCardInRegion(actorCard, RegionType.TORPOR);
        } else {
            actorCard = GameRules.requireCard(game, cmd.actorRef());
            GameRules.requireCardInRegion(actorCard, RegionType.READY);
        }

        if (!actorCard.isMinion()) {
            throw new GameRuleException("Only minions can declare actions");
        }
        if (actorCard.isLocked()) {
            throw new GameRuleException("A locked minion cannot declare an action");
        }
        if (!actor.equals(actorCard.getOwnerName())) {
            throw new GameRuleException("You do not control this minion");
        }

        if (game.isRulesEnforced()) {
            enforceDeclarationRules(game, actorCard, cmd, actor);
        }

        PendingActionState pending = new PendingActionState();
        pending.setActorRef(cmd.actorRef());
        pending.setActionType(cmd.actionType());
        pending.setTargetPlayerName(cmd.targetPlayerName());
        pending.setStatus(ActionStatus.DURING_ACTION);
        pending.setBleedAmount(cmd.actionType() == ActionType.BLEED ? 1 : 0);
        if (cmd.actionType() == ActionType.POLITICAL) {
            pending.setReferendumTerms(cmd.referendumTerms());
        }

        ImpulseContext context = cmd.targetPlayerName() != null
                ? ImpulseContext.DIRECTED_SINGLE
                : ImpulseContext.UNDIRECTED;
        ImpulseState impulse = ImpulseEngine.open(game, context, actor, cmd.targetPlayerName());

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
        if (pending.isBlocksDeclined()) {
            throw new GameRuleException("Block attempts are closed — blocks have already been declined");
        }

        CardData blocker = GameRules.requireCard(game, cmd.blockerRef());
        GameRules.requireCardInRegion(blocker, RegionType.READY);
        if (!blocker.isMinion()) {
            throw new GameRuleException("Only minions can block");
        }
        boolean wakeGranted = pending.getWakePermissionByCardId().contains(blocker.getId());
        if (blocker.isLocked() && !wakeGranted) {
            throw new GameRuleException("A locked minion cannot block");
        }
        if (!actor.equals(blocker.getOwnerName())) {
            throw new GameRuleException("You do not control this minion");
        }
        String actingPlayer = pending.getActorRef() != null ? pending.getActorRef().playerName() : null;
        if (actor.equals(actingPlayer)) {
            throw new GameRuleException("The acting player cannot block their own action");
        }

        if (game.isRulesEnforced()) {
            enforceBlockEligibility(game, pending, actor);
            enforceNotRestricted(pending, cmd.blockerRef(), RestrictionType.CANNOT_BLOCK,
                    "This minion cannot block this action");
        }

        PendingActionState updated = new PendingActionState(pending);
        updated.setCurrentBlockerRef(cmd.blockerRef());
        updated.setCurrentBlockerCardId(blocker.getId());

        List<String> passOrder = List.of(actingPlayer != null ? actingPlayer : actor, actor);
        SequencingWindowState seq = new SequencingWindowState();
        seq.setActive(true);
        seq.setWindowType(SequencingWindowType.BLOCK_ATTEMPT);
        seq.setPassOrder(passOrder);
        seq.setConsecutivePasses(0);
        seq.setCurrentHolder(passOrder.get(0));

        String msg = actor + " attempts to block with " + blocker.getName() + " — stealth/intercept window opens";
        return new CommandResult(game, msg,
                new CommandLogData.AttemptBlockLog(actor, blocker.getName()),
                List.of(new PendingActionChangedEffect(true, updated),
                        new SequencingWindowChangedEffect(true, seq)));
    }

    public static CommandResult handleAddStealth(GameData game, AddStealth cmd, String actor) {
        PendingActionState pending = game.getPendingAction();
        if (pending == null || pending.getStatus() != ActionStatus.DURING_ACTION) {
            throw new GameRuleException("No action in progress");
        }
        String blockerId = pending.getCurrentBlockerCardId();
        if (blockerId == null) {
            throw new GameRuleException("Stealth can only be added during an active block attempt");
        }
        int intercept = pending.getInterceptsByBlockerRef().getOrDefault(blockerId, 0);
        if (intercept < pending.getStealth()) {
            throw new GameRuleException("Stealth is not needed — the blocker's intercept cannot currently succeed");
        }

        PendingActionState updated = new PendingActionState(pending);
        updated.setStealth(pending.getStealth() + cmd.amount());

        List<GameEffect> effects = new ArrayList<>();
        effects.add(new PendingActionChangedEffect(true, updated));
        resetBlockAttemptWindow(game, actor, effects);

        String msg = actor + " adds " + cmd.amount() + " stealth (total: " + updated.getStealth() + ")";
        return new CommandResult(game, msg,
                new CommandLogData.GenericLog(actor, "add_stealth"),
                effects);
    }

    public static CommandResult handleAddIntercept(GameData game, AddIntercept cmd, String actor) {
        PendingActionState pending = game.getPendingAction();
        if (pending == null || pending.getStatus() != ActionStatus.DURING_ACTION) {
            throw new GameRuleException("No action in progress");
        }
        String blockerId = pending.getCurrentBlockerCardId();
        if (blockerId == null) {
            throw new GameRuleException("Intercept can only be added during an active block attempt");
        }
        int currentIntercept = pending.getInterceptsByBlockerRef().getOrDefault(blockerId, 0);
        if (currentIntercept >= pending.getStealth()) {
            throw new GameRuleException("Intercept is not needed — the blocker already has enough intercept to succeed");
        }

        PendingActionState updated = new PendingActionState(pending);
        updated.getInterceptsByBlockerRef().put(blockerId, currentIntercept + cmd.amount());

        List<GameEffect> effects = new ArrayList<>();
        effects.add(new PendingActionChangedEffect(true, updated));
        resetBlockAttemptWindow(game, actor, effects);

        int newIntercept = currentIntercept + cmd.amount();
        String msg = actor + " adds " + cmd.amount() + " intercept (total for blocker: " + newIntercept + ")";
        return new CommandResult(game, msg,
                new CommandLogData.GenericLog(actor, "add_intercept"),
                effects);
    }

    public static CommandResult handleRedirectAction(GameData game, RedirectAction cmd, String actor) {
        PendingActionState pending = game.getPendingAction();
        if (pending == null || pending.getStatus() != ActionStatus.DURING_ACTION) {
            throw new GameRuleException("No action in progress to redirect");
        }
        if (!pending.isBlocksDeclined()) {
            throw new GameRuleException("Redirects are only legal after blocks have been declined");
        }

        PendingActionState updated = new PendingActionState(pending);
        updated.setTargetPlayerName(cmd.newTargetPlayer());
        updated.setBlocksDeclined(false);
        updated.setPassedBlockWindowsByPlayer(new java.util.HashSet<>());

        String actingPlayer = pending.getActorRef().playerName();
        ImpulseContext context = cmd.newTargetPlayer() != null
                ? ImpulseContext.DIRECTED_SINGLE
                : ImpulseContext.UNDIRECTED;
        ImpulseState newImpulse = ImpulseEngine.open(game, context, actingPlayer, cmd.newTargetPlayer());

        String msg = actor + " redirected the action to " + cmd.newTargetPlayer() + " — block window reopens";
        return new CommandResult(game, msg,
                new CommandLogData.GenericLog(actor, "redirect_action"),
                List.of(new PendingActionChangedEffect(true, updated),
                        new ImpulseWindowChangedEffect(true, newImpulse)));
    }

    public static CommandResult handleGrantWake(GameData game, GrantWake cmd, String actor) {
        PendingActionState pending = game.getPendingAction();
        if (pending == null || pending.getStatus() != ActionStatus.DURING_ACTION) {
            throw new GameRuleException("No action in progress");
        }
        CardData minion = GameRules.requireCard(game, cmd.minionRef());
        if (!minion.isMinion()) {
            throw new GameRuleException("Only minions can receive wake permission");
        }
        if (!minion.isLocked()) {
            throw new GameRuleException("Wake permission is only needed for locked minions");
        }
        if (!actor.equals(minion.getOwnerName())) {
            throw new GameRuleException("You do not control this minion");
        }

        PendingActionState updated = new PendingActionState(pending);
        updated.getWakePermissionByCardId().add(minion.getId());

        String msg = actor + " granted wake permission to " + minion.getName();
        return new CommandResult(game, msg,
                new CommandLogData.GenericLog(actor, "grant_wake"),
                List.of(new PendingActionChangedEffect(true, updated)));
    }

    /** Resolves the active block attempt after both players pass in the BLOCK_ATTEMPT window. */
    public static List<GameEffect> resolveBlockAttempt(GameData game) {
        PendingActionState pending = game.getPendingAction();
        if (pending == null || pending.getCurrentBlockerCardId() == null) return List.of();

        String blockerId = pending.getCurrentBlockerCardId();
        CardRef blockerRef = pending.getCurrentBlockerRef();
        int intercept = pending.getInterceptsByBlockerRef().getOrDefault(blockerId, 0);
        int stealth = pending.getStealth();

        List<GameEffect> effects = new ArrayList<>();
        if (intercept >= stealth) {
            // Block succeeds
            String nraKey = nraKey(pending.getActionType());
            CardData actorCard = game.getCardByRef(pending.getActorRef());

            PendingActionState blocked = pending.withStatus(ActionStatus.BLOCKED);
            blocked.setBlockerRef(blockerRef);
            blocked.setCurrentBlockerRef(null);
            blocked.setCurrentBlockerCardId(null);
            blocked.setReachedResolution(true);

            effects.add(new CardLockedEffect(blockerId, true));
            effects.add(new PendingActionChangedEffect(true, blocked));
            effects.add(new ImpulseWindowChangedEffect(false));
            if (nraKey != null && actorCard != null) {
                effects.add(new NraRecordedEffect(actorCard.getId(), nraKey));
            }
        } else {
            // Block fails — clear currentBlockerRef; keep impulse window open
            PendingActionState failed = new PendingActionState(pending);
            failed.setCurrentBlockerRef(null);
            failed.setCurrentBlockerCardId(null);
            effects.add(new PendingActionChangedEffect(true, failed));
        }
        return effects;
    }

    private static void resetBlockAttemptWindow(GameData game, String actor, List<GameEffect> effects) {
        SequencingWindowState seq = game.getSequencingWindow();
        if (seq != null && seq.isActive() && seq.getWindowType() == SequencingWindowType.BLOCK_ATTEMPT) {
            List<String> order = seq.getPassOrder();
            int idx = order.indexOf(actor);
            String nextHolder = order.get((idx + 1) % order.size());
            SequencingWindowState reset = new SequencingWindowState();
            reset.setActive(true);
            reset.setWindowType(SequencingWindowType.BLOCK_ATTEMPT);
            reset.setPassOrder(order);
            reset.setConsecutivePasses(0);
            reset.setCurrentHolder(nextHolder);
            effects.add(new SequencingWindowChangedEffect(true, reset));
        }
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

        CardData actorCard = game.getCardByRef(pending.getActorRef());
        String actingPlayer = actorCard != null ? actorCard.getOwnerName() : actor;
        String nraKey = nraKey(pending.getActionType());

        PendingActionState resolved = pending.withStatus(ActionStatus.AFTER_RESOLUTION);
        resolved.setReachedResolution(true);
        resolved.setActionSuccessful(true);

        List<String> passOrder = ImpulseEngine.buildPassOrder(game, ImpulseContext.UNDIRECTED, actingPlayer, null);

        SequencingWindowState seq = new SequencingWindowState();
        seq.setActive(true);
        seq.setWindowType(SequencingWindowType.AFTER_RESOLUTION);
        seq.setPassOrder(passOrder);
        seq.setConsecutivePasses(0);
        seq.setCurrentHolder(actingPlayer);

        List<GameEffect> effects = new ArrayList<>();
        effects.add(new PendingActionChangedEffect(true, resolved));
        effects.add(new SequencingWindowChangedEffect(true, seq));

        if (nraKey != null && actorCard != null) {
            effects.add(new NraRecordedEffect(actorCard.getId(), nraKey));
        }

        if (game.isRulesEnforced()) {
            applyResolutionEffects(game, pending, resolved, actingPlayer, effects);
        }

        String msg = actor + " resolved the action — after-resolution sequencing window is open";
        return new CommandResult(game, msg, new CommandLogData.ResolveActionLog(actor), effects);
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

    public static CommandResult handleResumeBlockWindow(GameData game, String actingPlayer) {
        PendingActionState pending = game.getPendingAction();
        if (pending == null) return null;
        PendingActionState updated = new PendingActionState(pending);
        updated.setBlocksDeclined(true);
        ImpulseState blocksDeclinedWindow = ImpulseEngine.open(game, ImpulseContext.UNDIRECTED, actingPlayer, null);
        return new CommandResult(game,
                "All players passed — blocks declined; acting player has priority before resolution",
                null,
                List.of(new PendingActionChangedEffect(true, updated),
                        new ImpulseWindowChangedEffect(true, blocksDeclinedWindow)));
    }

    // ── Declaration guards ────────────────────────────────────────────────────

    private static void enforceDeclarationRules(GameData game, CardData actorCard, DeclareAction cmd, String actor) {
        // NRA check
        String nraKey = nraKey(cmd.actionType());
        if (nraKey != null) {
            Set<String> locked = game.getNraActionsByCardId().getOrDefault(actorCard.getId(), Set.of());
            if (locked.contains(nraKey)) {
                throw new GameRuleException("This minion cannot repeat this action this turn (NRA)");
            }
        }

        // Recruited ally gate: allies recruited this turn may not act
        if (game.getRecruitedThisTurn().contains(actorCard.getId())) {
            throw new GameRuleException("An ally recruited this turn cannot act");
        }

        // Mandatory hunt gate: vampires with 0 blood and capacity > 0 must hunt
        List<CardData> mandatoryHunters = readyUnlockedVampiresOf(game, actor).stream()
                .filter(m -> m.getCapacity() > 0 && m.getCounters() == 0)
                .toList();
        if (!mandatoryHunters.isEmpty()) {
            boolean actorHasMandatoryHunt = mandatoryHunters.stream()
                    .anyMatch(m -> m.getId().equals(actorCard.getId()));
            if (actorHasMandatoryHunt && cmd.actionType() != ActionType.HUNT) {
                throw new GameRuleException("This vampire must hunt (no blood)");
            }
            boolean otherHasMandatoryHunt = mandatoryHunters.stream()
                    .anyMatch(m -> !m.getId().equals(actorCard.getId()));
            if (otherHasMandatoryHunt && cmd.actionType() != ActionType.HUNT) {
                throw new GameRuleException("Another vampire must hunt before a non-mandatory action can be taken");
            }
        }
    }

    private static List<CardData> readyUnlockedVampiresOf(GameData game, String playerName) {
        PlayerData player = game.getPlayer(playerName);
        if (player == null) return List.of();
        return player.getRegion(RegionType.READY).getCards().stream()
                .filter(c -> c.isMinion() && !c.isLocked() && c.getType() == CardType.VAMPIRE)
                .toList();
    }

    // ── Block eligibility guards ──────────────────────────────────────────────

    private static void enforceBlockEligibility(GameData game, PendingActionState pending, String actor) {
        ImpulseState impulse = game.getImpulseWindow();
        if (impulse == null || !impulse.isActive()) {
            throw new GameRuleException("The impulse window has closed; blocking is no longer permitted");
        }
        if (!actor.equals(impulse.getCurrentImpulseHolder())) {
            throw new GameRuleException("It is not your turn to act in the impulse window");
        }
        // Directed action: only the target Methuselah's minions may block
        String target = pending.getTargetPlayerName();
        if (target != null && !actor.equals(target)) {
            throw new GameRuleException("Only the target Methuselah's minions may block a directed action");
        }
    }

    static void enforceNotRestricted(PendingActionState pending, CardRef ref, RestrictionType type, String message) {
        if (pending != null && pending.isRestricted(type, ref)) {
            throw new GameRuleException(message);
        }
    }

    // ── Resolution effects ────────────────────────────────────────────────────

    private static void applyResolutionEffects(GameData game, PendingActionState pending,
                                               PendingActionState resolved, String actingPlayer,
                                               List<GameEffect> effects) {
        CardData actorCard = game.getCardByRef(pending.getActorRef());

        switch (pending.getActionType()) {
            case BLEED -> {
                int bleedAmount = pending.getBleedAmount();
                String target = pending.getTargetPlayerName();
                if (target != null) {
                    effects.add(new PlayerPoolChangedEffect(target, -bleedAmount));
                }
                if (bleedAmount >= 1) {
                    effects.add(new EdgeChangedEffect(actingPlayer));
                    resolved.setBleedSuccessful(true);
                }
            }
            case HUNT -> {
                if (actorCard != null) {
                    int capacity = actorCard.getCapacity();
                    int current = actorCard.getCounters();
                    int gain = Math.min(1, capacity - current);
                    if (gain > 0) {
                        effects.add(new CardCounterChangedEffect(actorCard.getId(), gain));
                    }
                }
            }
            case LEAVE_TORPOR -> {
                if (actorCard != null) {
                    int blood = actorCard.getCounters();
                    if (blood >= 2) {
                        effects.add(new CardCounterChangedEffect(actorCard.getId(), -2));
                        effects.add(new CardMovedEffect(actorCard.getId(), actorCard.getOwnerName(),
                                RegionType.READY.name()));
                    }
                    // If insufficient blood, action fizzles — no movement, no counter change
                }
            }
            case POLITICAL -> {
                ReferendumState ref = ReferendumHandler.openReferendum(game, actingPlayer, pending.getReferendumTerms());
                effects.add(new ReferendumStateChangedEffect(ref));
            }
            case EQUIP, EMPLOY_RETAINER, RECRUIT_ALLY, RESCUE, DIABLERISE, CUSTOM -> {
                // Stubs: no automatic effect in this tranche
            }
        }
    }

    // ── NRA key helper ────────────────────────────────────────────────────────

    static String nraKey(ActionType actionType) {
        return switch (actionType) {
            case BLEED -> "BLEED";
            case POLITICAL -> "POLITICAL";
            default -> null;
        };
    }
}

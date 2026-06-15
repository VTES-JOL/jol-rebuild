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

public final class CombatHandler {
    private CombatHandler() {}

    // ── StartCombat ────────────────────────────────────────────────────────────

    public static CommandResult handleStartCombat(GameData game, StartCombat cmd, String actor) {
        CardData attacker = GameRules.requireCard(game, cmd.attackerRef());
        CardData defender = GameRules.requireCard(game, cmd.defenderRef());
        GameRules.requireCardInRegion(attacker, RegionType.READY);
        GameRules.requireCardInRegion(defender, RegionType.READY);
        if (!attacker.isMinion() || !defender.isMinion()) {
            throw new GameRuleException("Both combatants must be minions");
        }
        if (attacker.getOwnerName().equals(defender.getOwnerName())) {
            throw new GameRuleException("A minion cannot enter combat with another of its own controller's minions");
        }

        if (game.getCombatState() != null) {
            // A combat is already underway — queue this pair.
            List<CombatPair> queue = new ArrayList<>(game.getCombatQueue());
            queue.add(new CombatPair(cmd.attackerRef(), cmd.defenderRef()));
            return new CommandResult(game, actor + " queued combat: " + attacker.getName() + " vs " + defender.getName(),
                    null, List.of(new CombatQueueChangedEffect(queue)));
        }

        CombatState combat = new CombatState();
        combat.setAttackerRef(cmd.attackerRef());
        combat.setDefenderRef(cmd.defenderRef());
        combat.setRound(1);
        combat.setRange(Range.CLOSE);
        combat.setStep(CombatStep.BEFORE_RANGE);

        ImpulseWindowChangedEffect window = openCombatImpulseWindow(game, combat);
        String msg = actor + " began combat: " + attacker.getName() + " vs " + defender.getName();
        return new CommandResult(game, msg, null,
                List.of(new CombatStateChangedEffect(combat), window));
    }

    // ── Maneuver ───────────────────────────────────────────────────────────────

    public static CommandResult handleManeuver(GameData game, Maneuver cmd, String actor) {
        CombatState combat = requireCombat(game);
        if (combat.getStep() != CombatStep.DETERMINE_RANGE) {
            throw new GameRuleException("Maneuvers may only be played during the determine-range step");
        }
        CardData combatant = requireCombatant(game, combat, cmd.combatantRef());
        requireOwnership(actor, combatant);
        if (combatant.getId().equals(combat.getManeuverLastPlayedBy())) {
            throw new GameRuleException("A combatant cannot maneuver twice in a row");
        }

        CombatState updated = new CombatState(combat);
        updated.setRange(cmd.toRange());
        updated.setManeuverLastPlayedBy(combatant.getId());

        ImpulseWindowChangedEffect window = openCombatImpulseWindow(game, updated);
        String msg = actor + " maneuvered to " + cmd.toRange() + " range";
        return new CommandResult(game, msg, null,
                List.of(new CombatStateChangedEffect(updated), window));
    }

    // ── DeclareStrike ──────────────────────────────────────────────────────────

    public static CommandResult handleDeclareStrike(GameData game, DeclareStrike cmd, String actor) {
        CombatState combat = requireCombat(game);
        if (combat.getStep() != CombatStep.STRIKE_DECLARATION) {
            throw new GameRuleException("Strikes may only be declared during the strike-declaration step");
        }
        CardData combatant = requireCombatant(game, combat, cmd.combatantRef());
        requireOwnership(actor, combatant);
        validateStrikeRange(combat.getRange(), cmd.strikeType());

        boolean isAttacker = isAttacker(combat, cmd.combatantRef());
        CombatState updated = new CombatState(combat);
        Strike strike = new Strike(cmd.strikeType(), cmd.weaponRef(), cmd.damage());
        if (isAttacker) {
            updated.setAttackerStrike(strike);
        } else {
            updated.setDefenderStrike(strike);
        }

        if (updated.getAttackerStrike() != null && updated.getDefenderStrike() != null) {
            StrikeType atk = updated.getAttackerStrike().getStrikeType();
            StrikeType def = updated.getDefenderStrike().getStrikeType();

            if (atk == StrikeType.COMBAT_ENDS || def == StrikeType.COMBAT_ENDS) {
                updated.setPendingDamageAttacker(0);
                updated.setPendingDamageDefender(0);
                updated.setStep(CombatStep.END_OF_ROUND);
                List<GameEffect> effects = new ArrayList<>();
                effects.add(new CombatStateChangedEffect(updated));
                effects.add(new SequencingWindowChangedEffect(true,
                        buildCombatWindow(game, SequencingWindowType.COMBAT_END_OF_ROUND)));
                return new CommandResult(game, actor + " declared combat ends — combat is ending", null, effects);
            }

            // Compute damage. DODGE cancels the opposing strike's damage.
            int dmgToDefender = strikeDamage(atk, updated.getAttackerStrike());
            int dmgToAttacker = strikeDamage(def, updated.getDefenderStrike());
            if (def == StrikeType.DODGE) dmgToDefender = 0;
            if (atk == StrikeType.DODGE) dmgToAttacker = 0;
            updated.setPendingDamageDefender(updated.getPendingDamageDefender() + dmgToDefender);
            updated.setPendingDamageAttacker(updated.getPendingDamageAttacker() + dmgToAttacker);
            updated.setStep(CombatStep.DAMAGE_RESOLUTION);

            List<GameEffect> effects = new ArrayList<>();
            effects.add(new CombatStateChangedEffect(updated));
            effects.add(new SequencingWindowChangedEffect(true,
                    buildCombatWindow(game, SequencingWindowType.COMBAT_DAMAGE_PREVENTION)));
            return new CommandResult(game, actor + " declared a " + cmd.strikeType() + " strike — damage resolution", null, effects);
        }

        String msg = actor + " declared a " + cmd.strikeType() + " strike";
        return new CommandResult(game, msg, null, List.of(new CombatStateChangedEffect(updated)));
    }

    // ── PreventDamage ──────────────────────────────────────────────────────────

    public static CommandResult handlePreventDamage(GameData game, PreventDamage cmd, String actor) {
        CombatState combat = requireCombat(game);
        if (combat.getStep() != CombatStep.DAMAGE_RESOLUTION) {
            throw new GameRuleException("Damage may only be prevented during the damage-resolution step");
        }
        CardData combatant = requireCombatant(game, combat, cmd.combatantRef());
        requireOwnership(actor, combatant);

        CombatState updated = new CombatState(combat);
        if (isAttacker(combat, cmd.combatantRef())) {
            updated.setPendingDamageAttacker(Math.max(0, updated.getPendingDamageAttacker() - cmd.amount()));
        } else {
            updated.setPendingDamageDefender(Math.max(0, updated.getPendingDamageDefender() - cmd.amount()));
        }

        String msg = actor + " prevented " + cmd.amount() + " damage on " + combatant.getName();
        return new CommandResult(game, msg, null, List.of(new CombatStateChangedEffect(updated)));
    }

    // ── DeclarePress ───────────────────────────────────────────────────────────

    public static CommandResult handleDeclarePress(GameData game, DeclarePress cmd, String actor) {
        CombatState combat = requireCombat(game);
        if (combat.getStep() != CombatStep.PRESS) {
            throw new GameRuleException("Press may only be declared during the press step");
        }
        CardData combatant = requireCombatant(game, combat, cmd.combatantRef());
        requireOwnership(actor, combatant);

        CombatState updated = new CombatState(combat);
        if (isAttacker(combat, cmd.combatantRef())) {
            updated.setAttackerPress(cmd.decision());
        } else {
            updated.setDefenderPress(cmd.decision());
        }

        if (updated.getAttackerPress() != null && updated.getDefenderPress() != null) {
            boolean bothContinue = updated.getAttackerPress() == PressDecision.CONTINUE
                    && updated.getDefenderPress() == PressDecision.CONTINUE;
            if (bothContinue) {
                // New round
                updated.setRound(updated.getRound() + 1);
                updated.setRange(Range.CLOSE);
                updated.setStep(CombatStep.BEFORE_RANGE);
                updated.setAttackerStrike(null);
                updated.setDefenderStrike(null);
                updated.setAttackerPress(null);
                updated.setDefenderPress(null);
                updated.setPendingDamageAttacker(0);
                updated.setPendingDamageDefender(0);
                updated.setPendingAggravatedAttacker(0);
                updated.setPendingAggravatedDefender(0);
                updated.setManeuverLastPlayedBy(null);
                ImpulseWindowChangedEffect window = openCombatImpulseWindow(game, updated);
                String msg = actor + " pressed to continue — combat round " + updated.getRound() + " begins";
                return new CommandResult(game, msg, null,
                        List.of(new CombatStateChangedEffect(updated), window));
            }
            // At least one chose END — begin combat ending
            updated.setStep(CombatStep.END_OF_ROUND);
            List<GameEffect> effects = new ArrayList<>();
            effects.add(new CombatStateChangedEffect(updated));
            effects.add(new SequencingWindowChangedEffect(true,
                    buildCombatWindow(game, SequencingWindowType.COMBAT_END_OF_ROUND)));
            return new CommandResult(game, actor + " declined to press — combat is ending", null, effects);
        }

        String msg = actor + " declared press " + cmd.decision();
        return new CommandResult(game, msg, null, List.of(new CombatStateChangedEffect(updated)));
    }

    // ── BeginCombatEnding ──────────────────────────────────────────────────────

    public static CommandResult handleBeginCombatEnding(GameData game, BeginCombatEnding cmd, String actor) {
        CombatState combat = requireCombat(game);
        SequencingWindowState window = buildCombatWindow(game, SequencingWindowType.COMBAT_END_OF_ROUND);
        return new CommandResult(game, actor + " began combat ending", null,
                List.of(new SequencingWindowChangedEffect(true, window)));
    }

    // ── ClearCombatState ───────────────────────────────────────────────────────

    public static CommandResult handleClearCombatState(GameData game, ClearCombatState cmd, String actor) {
        requireCombat(game);
        List<GameEffect> effects = clearCombatEffects(game);
        return new CommandResult(game, actor + " cleared combat", null, effects);
    }

    // ── Step advancement (driven by all-pass in the COMBAT impulse window) ──────

    public static List<GameEffect> advanceCombatStepAfterImpulse(GameData game) {
        CombatState current = game.getCombatState();
        if (current == null) return List.of();
        List<GameEffect> effects = new ArrayList<>();
        CombatState updated = new CombatState(current);
        switch (current.getStep()) {
            case BEFORE_RANGE -> {
                updated.setStep(CombatStep.DETERMINE_RANGE);
                effects.add(new CombatStateChangedEffect(updated));
                effects.add(openCombatImpulseWindow(game, updated));
            }
            case DETERMINE_RANGE -> {
                updated.setStep(CombatStep.BEFORE_STRIKES);
                effects.add(new CombatStateChangedEffect(updated));
                effects.add(openCombatImpulseWindow(game, updated));
            }
            case BEFORE_STRIKES -> {
                updated.setStep(CombatStep.STRIKE_DECLARATION);
                effects.add(new CombatStateChangedEffect(updated));
                // No new window — players declare strikes directly via DeclareStrike.
            }
            default -> { /* other steps don't advance via impulse pass */ }
        }
        return effects;
    }

    // ── Damage application (after the damage-prevention window closes) ───────────

    public static List<GameEffect> applyDamageAndAdvance(GameData game) {
        CombatState combat = game.getCombatState();
        if (combat == null) return List.of();
        List<GameEffect> effects = new ArrayList<>();

        applyDamageToCombatant(game, combat.getAttackerRef(),
                combat.getPendingDamageAttacker(), combat.getPendingAggravatedAttacker(), effects);
        applyDamageToCombatant(game, combat.getDefenderRef(),
                combat.getPendingDamageDefender(), combat.getPendingAggravatedDefender(), effects);

        CombatState updated = new CombatState(combat);
        updated.setPendingDamageAttacker(0);
        updated.setPendingDamageDefender(0);
        updated.setPendingAggravatedAttacker(0);
        updated.setPendingAggravatedDefender(0);
        updated.setStep(CombatStep.PRESS);
        effects.add(new CombatStateChangedEffect(updated));
        return effects;
    }

    private static void applyDamageToCombatant(GameData game, CardRef ref,
                                               int damage, int aggravated, List<GameEffect> effects) {
        if (ref == null || (damage <= 0 && aggravated <= 0)) return;
        CardData card = game.getCardByRef(ref);
        if (card == null) return;
        if (card.getType() == CardType.VAMPIRE) {
            int blood = card.getCounters();
            // Aggravated damage always sends the vampire to torpor regardless of blood or prevention.
            if (aggravated > 0) {
                if (blood > 0) effects.add(new CardCounterChangedEffect(card.getId(), -blood));
                effects.add(new CardMovedEffect(card.getId(), card.getOwnerName(), RegionType.TORPOR.name()));
            } else if (damage >= blood) {
                if (blood > 0) effects.add(new CardCounterChangedEffect(card.getId(), -blood));
                effects.add(new CardMovedEffect(card.getId(), card.getOwnerName(), RegionType.TORPOR.name()));
            } else {
                effects.add(new CardCounterChangedEffect(card.getId(), -damage));
            }
        } else {
            // Allies/retainers track life as counters; reduce, burn if depleted.
            int life = card.getCounters();
            int totalDamage = damage + aggravated;
            if (totalDamage >= life) {
                if (life > 0) effects.add(new CardCounterChangedEffect(card.getId(), -life));
                effects.add(new CardMovedEffect(card.getId(), card.getOwnerName(), RegionType.ASH_HEAP.name()));
            } else {
                effects.add(new CardCounterChangedEffect(card.getId(), -totalDamage));
            }
        }
    }

    // ── Combat ending / clearing ────────────────────────────────────────────────

    public static List<GameEffect> clearCombatEffects(GameData game) {
        List<GameEffect> effects = new ArrayList<>();
        effects.add(new CombatStateChangedEffect(null));

        List<CombatPair> queue = game.getCombatQueue();
        if (queue != null && !queue.isEmpty()) {
            List<CombatPair> remaining = new ArrayList<>(queue.subList(1, queue.size()));
            CombatPair next = queue.get(0);
            CombatState newCombat = new CombatState();
            newCombat.setAttackerRef(next.attackerRef());
            newCombat.setDefenderRef(next.defenderRef());
            newCombat.setRound(1);
            newCombat.setRange(Range.CLOSE);
            newCombat.setStep(CombatStep.BEFORE_RANGE);
            effects.add(new CombatQueueChangedEffect(remaining));
            effects.add(new CombatStateChangedEffect(newCombat));
            effects.add(openCombatImpulseWindow(game, newCombat));
            return effects;
        }

        PendingActionState pending = game.getPendingAction();
        if (pending != null) {
            if (pending.getStatus() == ActionStatus.ACTION_CONTINUING) {
                // Re-enter the block-attempt loop for the continuing action.
                String actingPlayer = pending.getActorRef() != null ? pending.getActorRef().playerName() : null;
                PendingActionState resumed = new PendingActionState(pending);
                resumed.setStatus(ActionStatus.DURING_ACTION);
                resumed.setBlocksDeclined(false);
                resumed.setCurrentBlockerRef(null);
                resumed.setCurrentBlockerCardId(null);
                resumed.setPassedBlockWindowsByPlayer(new java.util.HashSet<>());
                ImpulseContext context = pending.getTargetPlayerName() != null
                        ? ImpulseContext.DIRECTED_SINGLE : ImpulseContext.UNDIRECTED;
                ImpulseState impulse = ImpulseEngine.open(game, context, actingPlayer, pending.getTargetPlayerName());
                effects.add(new PendingActionChangedEffect(true, resumed));
                effects.add(new ImpulseWindowChangedEffect(true, impulse));
            } else {
                PendingActionState resolved = pending.withStatus(ActionStatus.AFTER_RESOLUTION);
                String actingPlayer = pending.getActorRef() != null ? pending.getActorRef().playerName() : null;
                List<String> passOrder = ImpulseEngine.buildPassOrder(game, ImpulseContext.UNDIRECTED, actingPlayer, null);
                SequencingWindowState seq = new SequencingWindowState();
                seq.setActive(true);
                seq.setWindowType(SequencingWindowType.AFTER_RESOLUTION);
                seq.setPassOrder(passOrder);
                seq.setConsecutivePasses(0);
                seq.setCurrentHolder(actingPlayer);
                effects.add(new PendingActionChangedEffect(true, resolved));
                effects.add(new SequencingWindowChangedEffect(true, seq));
            }
        }
        return effects;
    }

    // ── Window helpers ───────────────────────────────────────────────────────────

    static ImpulseWindowChangedEffect openCombatImpulseWindow(GameData game, CombatState combat) {
        String attackerPlayer = playerOf(game, combat.getAttackerRef());
        ImpulseState state = ImpulseEngine.open(game, ImpulseContext.COMBAT, attackerPlayer, null);
        return new ImpulseWindowChangedEffect(true, state);
    }

    public static SequencingWindowState buildCombatWindow(GameData game, SequencingWindowType type) {
        CombatState combat = game.getCombatState();
        if (combat == null) return null;
        String attackerPlayer = playerOf(game, combat.getAttackerRef());
        String defenderPlayer = playerOf(game, combat.getDefenderRef());
        List<String> passOrder = new ArrayList<>();
        if (attackerPlayer != null) passOrder.add(attackerPlayer);
        if (defenderPlayer != null && !defenderPlayer.equals(attackerPlayer)) passOrder.add(defenderPlayer);
        if (passOrder.isEmpty()) passOrder.add(game.getCurrentPlayerName());

        SequencingWindowState seq = new SequencingWindowState();
        seq.setActive(true);
        seq.setWindowType(type);
        seq.setPassOrder(passOrder);
        seq.setConsecutivePasses(0);
        seq.setCurrentHolder(passOrder.get(0));
        return seq;
    }

    // ── Validation helpers ─────────────────────────────────────────────────────

    private static CombatState requireCombat(GameData game) {
        CombatState combat = game.getCombatState();
        if (combat == null) throw new GameRuleException("No combat is currently in progress");
        return combat;
    }

    private static boolean isAttacker(CombatState combat, CardRef ref) {
        return ref != null && ref.equals(combat.getAttackerRef());
    }

    private static CardData requireCombatant(GameData game, CombatState combat, CardRef ref) {
        if (ref == null || (!ref.equals(combat.getAttackerRef()) && !ref.equals(combat.getDefenderRef()))) {
            throw new GameRuleException("That minion is not part of this combat");
        }
        return GameRules.requireCard(game, ref);
    }

    private static void requireOwnership(String actor, CardData combatant) {
        if (!actor.equals(combatant.getOwnerName())) {
            throw new GameRuleException("You do not control this combatant");
        }
    }

    private static void validateStrikeRange(Range range, StrikeType type) {
        // DODGE, COMBAT_ENDS, FIREARM, OTHER_RANGED are legal at any range.
        boolean closeOnly = switch (type) {
            case HAND, MELEE_WEAPON, STEAL_BLOOD, FIXED_DAMAGE, FIRST_STRIKE -> true;
            case DODGE, COMBAT_ENDS, FIREARM, OTHER_RANGED -> false;
        };
        if (closeOnly && range != Range.CLOSE) {
            throw new GameRuleException(type + " strikes are only legal at close range");
        }
    }

    private static int strikeDamage(StrikeType type, Strike strike) {
        return switch (type) {
            case FIXED_DAMAGE -> strike.getDamage();
            case HAND, MELEE_WEAPON, FIREARM, OTHER_RANGED, FIRST_STRIKE -> 1;
            case DODGE, COMBAT_ENDS, STEAL_BLOOD -> 0;
        };
    }

    private static String playerOf(GameData game, CardRef ref) {
        if (ref == null) return null;
        CardData card = game.getCardByRef(ref);
        return card != null ? card.getOwnerName() : ref.playerName();
    }
}

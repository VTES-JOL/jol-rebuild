package net.deckserver.jol.game;

import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.enums.CombatStep;
import net.deckserver.jol.enums.PressDecision;
import net.deckserver.jol.enums.Range;
import net.deckserver.jol.enums.RestrictionType;
import net.deckserver.jol.game.command.CardRef;

import java.util.EnumMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@RegisterForReflection
public class CombatState {
    private CardRef attackerRef;
    private CardRef defenderRef;
    private int round = 1;
    private Range range = Range.CLOSE;
    private CombatStep step = CombatStep.BEFORE_RANGE;
    private Strike attackerStrike;
    private Strike defenderStrike;
    private String maneuverLastPlayedBy; // card ID
    private int pendingDamageAttacker;
    private int pendingDamageDefender;
    private int pendingAggravatedAttacker;
    private int pendingAggravatedDefender;
    private Map<RestrictionType, Set<CardRef>> combatRestrictions = new EnumMap<>(RestrictionType.class);
    private PressDecision attackerPress;
    private PressDecision defenderPress;

    public CombatState() {}

    public CombatState(CombatState src) {
        this.attackerRef = src.attackerRef;
        this.defenderRef = src.defenderRef;
        this.round = src.round;
        this.range = src.range;
        this.step = src.step;
        this.attackerStrike = src.attackerStrike != null ? new Strike(src.attackerStrike) : null;
        this.defenderStrike = src.defenderStrike != null ? new Strike(src.defenderStrike) : null;
        this.maneuverLastPlayedBy = src.maneuverLastPlayedBy;
        this.pendingDamageAttacker = src.pendingDamageAttacker;
        this.pendingDamageDefender = src.pendingDamageDefender;
        this.pendingAggravatedAttacker = src.pendingAggravatedAttacker;
        this.pendingAggravatedDefender = src.pendingAggravatedDefender;
        this.combatRestrictions = new EnumMap<>(RestrictionType.class);
        src.combatRestrictions.forEach((k, v) -> this.combatRestrictions.put(k, new HashSet<>(v)));
        this.attackerPress = src.attackerPress;
        this.defenderPress = src.defenderPress;
    }

    public CardRef getAttackerRef() { return attackerRef; }
    public void setAttackerRef(CardRef attackerRef) { this.attackerRef = attackerRef; }

    public CardRef getDefenderRef() { return defenderRef; }
    public void setDefenderRef(CardRef defenderRef) { this.defenderRef = defenderRef; }

    public int getRound() { return round; }
    public void setRound(int round) { this.round = round; }

    public Range getRange() { return range; }
    public void setRange(Range range) { this.range = range; }

    public CombatStep getStep() { return step; }
    public void setStep(CombatStep step) { this.step = step; }

    public Strike getAttackerStrike() { return attackerStrike; }
    public void setAttackerStrike(Strike attackerStrike) { this.attackerStrike = attackerStrike; }

    public Strike getDefenderStrike() { return defenderStrike; }
    public void setDefenderStrike(Strike defenderStrike) { this.defenderStrike = defenderStrike; }

    public String getManeuverLastPlayedBy() { return maneuverLastPlayedBy; }
    public void setManeuverLastPlayedBy(String maneuverLastPlayedBy) { this.maneuverLastPlayedBy = maneuverLastPlayedBy; }

    public int getPendingDamageAttacker() { return pendingDamageAttacker; }
    public void setPendingDamageAttacker(int pendingDamageAttacker) { this.pendingDamageAttacker = pendingDamageAttacker; }

    public int getPendingDamageDefender() { return pendingDamageDefender; }
    public void setPendingDamageDefender(int pendingDamageDefender) { this.pendingDamageDefender = pendingDamageDefender; }

    public int getPendingAggravatedAttacker() { return pendingAggravatedAttacker; }
    public void setPendingAggravatedAttacker(int pendingAggravatedAttacker) { this.pendingAggravatedAttacker = pendingAggravatedAttacker; }

    public int getPendingAggravatedDefender() { return pendingAggravatedDefender; }
    public void setPendingAggravatedDefender(int pendingAggravatedDefender) { this.pendingAggravatedDefender = pendingAggravatedDefender; }

    public Map<RestrictionType, Set<CardRef>> getCombatRestrictions() { return combatRestrictions; }
    public void setCombatRestrictions(Map<RestrictionType, Set<CardRef>> combatRestrictions) { this.combatRestrictions = combatRestrictions; }

    public PressDecision getAttackerPress() { return attackerPress; }
    public void setAttackerPress(PressDecision attackerPress) { this.attackerPress = attackerPress; }

    public PressDecision getDefenderPress() { return defenderPress; }
    public void setDefenderPress(PressDecision defenderPress) { this.defenderPress = defenderPress; }
}

package net.deckserver.jol.cucumber.steps;

import io.cucumber.java.en.And;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import io.quarkus.arc.Arc;
import net.deckserver.jol.cucumber.GameWorld;
import net.deckserver.jol.enums.*;
import net.deckserver.jol.game.CombatState;
import net.deckserver.jol.game.ImpulseState;
import net.deckserver.jol.game.PendingActionState;
import net.deckserver.jol.game.SequencingWindowState;
import net.deckserver.jol.game.command.*;
import net.deckserver.jol.services.GameCommandService;

import static org.junit.jupiter.api.Assertions.*;

public class CombatSteps {

    private final GameWorld world;
    private final GameCommandService commandService;

    public CombatSteps(GameWorld world) {
        this.world = world;
        this.commandService = Arc.container().select(GameCommandService.class).get();
    }

    @Given("there is a pending action in status {string}")
    public void pendingActionInStatus(String status) {
        PendingActionState pending = new PendingActionState();
        pending.setActorRef(world.minionRefs.get("VampA"));
        pending.setActionType(ActionType.BLEED);
        pending.setStatus(ActionStatus.valueOf(status));
        world.game.setPendingAction(pending);
    }

    @When("{string} starts combat with {string} vs a non-existent card")
    public void startCombatNonExistent(String player, String attacker) {
        world.lastException = null;
        CardRef atk = world.minionRefs.get(attacker);
        CardRef bogus = new CardRef(player, RegionType.READY, 99, -1);
        try {
            commandService.execute(player, new StartCombat(world.gameId, atk, bogus));
        } catch (Exception e) {
            world.lastException = e;
        }
    }

    @When("{string} starts combat between {string} and {string}")
    public void startCombat(String player, String attacker, String defender) {
        world.lastException = null;
        CardRef atk = world.minionRefs.get(attacker);
        CardRef def = world.minionRefs.get(defender);
        try {
            commandService.execute(player, new StartCombat(world.gameId, atk, def));
        } catch (Exception e) {
            world.lastException = e;
        }
    }

    @When("all combatants pass the combat impulse window")
    public void passCombatImpulse() {
        world.lastException = null;
        // Pass the *current* combat impulse window exactly once. The step advances when the
        // window closes; a fresh window may open for the next step, so stop as soon as the
        // combat step changes (or the window closes without reopening).
        CombatState before = world.game.getCombatState();
        CombatStep startStep = before != null ? before.getStep() : null;
        try {
            for (int safety = 0; safety < 10; safety++) {
                ImpulseState impulse = world.game.getImpulseWindow();
                if (impulse == null || !impulse.isActive()) break;
                CombatState now = world.game.getCombatState();
                if (now != null && now.getStep() != startStep) break;
                String holder = impulse.getCurrentImpulseHolder();
                commandService.execute(holder, new PassImpulse(world.gameId, holder));
            }
        } catch (Exception e) {
            world.lastException = e;
        }
    }

    @When("{string} maneuvers {string} to range {string}")
    public void maneuver(String player, String combatant, String range) {
        world.lastException = null;
        CardRef ref = world.minionRefs.get(combatant);
        try {
            commandService.execute(player, new Maneuver(world.gameId, ref, Range.valueOf(range)));
        } catch (Exception e) {
            world.lastException = e;
        }
    }

    @When("{string} declares a {string} strike for {string}")
    public void declareStrike(String player, String strikeType, String combatant) {
        world.lastException = null;
        CardRef ref = world.minionRefs.get(combatant);
        try {
            commandService.execute(player, new DeclareStrike(world.gameId, ref, StrikeType.valueOf(strikeType), null));
        } catch (Exception e) {
            world.lastException = e;
        }
    }

    @When("the combat damage prevention window closes")
    public void closeDamagePreventionWindow() {
        world.lastException = null;
        try {
            String holder = world.game.getSequencingWindow().getCurrentHolder();
            commandService.execute(holder, new CloseSequencingWindow(world.gameId));
        } catch (Exception e) {
            world.lastException = e;
        }
    }

    @When("the combat reaches the press step")
    public void reachPressStep() {
        // Advance BEFORE_RANGE -> DETERMINE_RANGE -> BEFORE_STRIKES -> STRIKE_DECLARATION
        passCombatImpulse();
        passCombatImpulse();
        passCombatImpulse();
        // Declare HAND strikes for both combatants
        CombatState combat = world.game.getCombatState();
        String attackerPlayer = playerOf(combat.getAttackerRef());
        String defenderPlayer = playerOf(combat.getDefenderRef());
        declareStrikeRef(attackerPlayer, combat.getAttackerRef());
        declareStrikeRef(defenderPlayer, combat.getDefenderRef());
        // Close damage prevention window -> applies damage, advances to PRESS
        closeDamagePreventionWindow();
    }

    @When("{string} declares press {string} for {string}")
    public void declarePress(String player, String decision, String combatant) {
        world.lastException = null;
        CardRef ref = world.minionRefs.get(combatant);
        try {
            commandService.execute(player, new DeclarePress(world.gameId, ref, PressDecision.valueOf(decision)));
        } catch (Exception e) {
            world.lastException = e;
        }
    }

    @When("all combat ending windows complete")
    public void completeCombatEndingWindows() {
        world.lastException = null;
        try {
            for (int safety = 0; safety < 12; safety++) {
                SequencingWindowState seq = world.game.getSequencingWindow();
                if (seq == null || !seq.isActive()) break;
                String holder = seq.getCurrentHolder();
                commandService.execute(holder, new CloseSequencingWindow(world.gameId));
            }
        } catch (Exception e) {
            world.lastException = e;
        }
    }

    // ── Assertions ──────────────────────────────────────────────────────────────

    @Then("combat is active with attacker {string} and defender {string}")
    public void assertCombatActive(String attacker, String defender) {
        CombatState combat = world.game.getCombatState();
        assertNotNull(combat, "No combat is active");
        assertEquals(world.minionRefs.get(attacker), combat.getAttackerRef());
        assertEquals(world.minionRefs.get(defender), combat.getDefenderRef());
    }

    @Then("the combat step is {string}")
    public void assertCombatStep(String step) {
        CombatState combat = world.game.getCombatState();
        assertNotNull(combat, "No combat is active");
        assertEquals(CombatStep.valueOf(step), combat.getStep(), "Combat step mismatch");
    }

    @Then("the combat range is {string}")
    public void assertCombatRange(String range) {
        CombatState combat = world.game.getCombatState();
        assertNotNull(combat, "No combat is active");
        assertEquals(Range.valueOf(range), combat.getRange());
    }

    @Then("the combat round is {int}")
    public void assertCombatRound(int round) {
        CombatState combat = world.game.getCombatState();
        assertNotNull(combat, "No combat is active");
        assertEquals(round, combat.getRound());
    }

    @Then("an impulse window is open with context {string}")
    public void assertImpulseContext(String context) {
        ImpulseState impulse = world.game.getImpulseWindow();
        assertNotNull(impulse, "No impulse window");
        assertTrue(impulse.isActive(), "Impulse window not active");
        assertEquals(ImpulseContext.valueOf(context), impulse.getContext());
    }

    @Then("the damage prevention window is open")
    public void assertDamagePreventionWindow() {
        SequencingWindowState seq = world.game.getSequencingWindow();
        assertNotNull(seq, "No sequencing window");
        assertTrue(seq.isActive(), "Sequencing window not active");
        assertEquals(SequencingWindowType.COMBAT_DAMAGE_PREVENTION, seq.getWindowType());
    }

    @Then("{string} is in torpor")
    public void assertInTorpor(String minion) {
        CardRef ref = world.minionRefs.get(minion);
        // After moving to torpor, the original READY ref no longer resolves; check torpor region by name.
        boolean inTorpor = world.game.getPlayer(ref.playerName())
                .getRegion(RegionType.TORPOR).getCards().stream()
                .anyMatch(c -> minion.equals(c.getName()));
        assertTrue(inTorpor, minion + " should be in torpor");
    }

    @Then("combat is cleared")
    public void assertCombatCleared() {
        assertNull(world.game.getCombatState(), "Combat should be cleared");
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────

    private void declareStrikeRef(String player, CardRef ref) {
        world.lastException = null;
        try {
            commandService.execute(player, new DeclareStrike(world.gameId, ref, StrikeType.HAND, null));
        } catch (Exception e) {
            world.lastException = e;
        }
    }

    private String playerOf(CardRef ref) {
        return ref.playerName();
    }
}

package net.deckserver.jol.cucumber.steps;

import io.cucumber.java.en.And;
import io.cucumber.java.en.Then;
import net.deckserver.jol.cucumber.GameWorld;
import net.deckserver.jol.enums.ActionStatus;
import net.deckserver.jol.exception.GameRuleException;
import net.deckserver.jol.game.CardData;
import net.deckserver.jol.game.command.CardRef;

import static org.junit.jupiter.api.Assertions.*;

public class AssertionSteps {

    private final GameWorld world;

    public AssertionSteps(GameWorld world) {
        this.world = world;
    }

    @Then("a rule violation should occur")
    public void assertRuleViolation() {
        assertNotNull(world.lastException, "Expected a rule violation but none occurred");
        assertInstanceOf(GameRuleException.class, world.lastException,
                "Expected GameRuleException but got: " + world.lastException);
    }

    @Then("a rule violation mentioning {string} should occur")
    public void assertRuleViolationMentioning(String keyword) {
        assertNotNull(world.lastException, "Expected a rule violation but none occurred");
        assertInstanceOf(GameRuleException.class, world.lastException);
        assertTrue(world.lastException.getMessage().toLowerCase().contains(keyword.toLowerCase()),
                "Expected message to mention '" + keyword + "' but was: " + world.lastException.getMessage());
    }

    @Then("no rule violation should occur")
    public void assertNoRuleViolation() {
        assertNull(world.lastException,
                "Expected no rule violation but got: " + (world.lastException != null ? world.lastException.getMessage() : ""));
    }

    @Then("{string}'s pool should be {int}")
    public void assertPool(String player, int expectedPool) {
        assertEquals(expectedPool, world.game.getPlayer(player).getPool(),
                player + "'s pool should be " + expectedPool);
    }

    @Then("{string}'s pool should decrease by {int}")
    public void assertPoolDecrease(String player, int delta) {
        int before = world.poolBefore.getOrDefault(player, world.game.getPlayer(player).getPool() + delta);
        int after = world.game.getPlayer(player).getPool();
        assertEquals(before - delta, after,
                player + "'s pool should have decreased by " + delta + " (was " + before + ", now " + after + ")");
    }

    @Then("{string} should hold the Edge")
    public void assertEdge(String player) {
        assertEquals(player, world.game.getEdgePlayer(),
                player + " should hold the Edge");
    }

    @Then("the action status should be {string}")
    public void assertActionStatus(String status) {
        assertNotNull(world.game.getPendingAction(), "No pending action");
        assertEquals(ActionStatus.valueOf(status), world.game.getPendingAction().getStatus(),
                "Action status should be " + status);
    }

    @Then("the impulse window should be open")
    public void assertImpulseOpen() {
        assertNotNull(world.game.getImpulseWindow());
        assertTrue(world.game.getImpulseWindow().isActive(), "Impulse window should be open");
    }

    @Then("the impulse window should be closed")
    public void assertImpulseClosed() {
        assertTrue(world.game.getImpulseWindow() == null || !world.game.getImpulseWindow().isActive(),
                "Impulse window should be closed");
    }

    @Then("{string} should have {int} blood")
    public void assertBlood(String minionName, int expectedBlood) {
        CardRef ref = world.minionRefs.get(minionName);
        assertNotNull(ref, "No ref registered for minion '" + minionName + "'");
        CardData card = world.game.getCardByRef(ref);
        assertNotNull(card, "Card not found for minion '" + minionName + "'");
        assertEquals(expectedBlood, card.getCounters(),
                minionName + " should have " + expectedBlood + " blood");
    }

    @And("{string} should be NRA-locked from {string}")
    public void assertNraLocked(String minionName, String actionKey) {
        CardRef ref = world.minionRefs.get(minionName);
        assertNotNull(ref, "No ref registered for minion '" + minionName + "'");
        CardData card = world.game.getCardByRef(ref);
        assertNotNull(card);
        assertTrue(world.game.getNraActionsByCardId()
                        .getOrDefault(card.getId(), java.util.Set.of())
                        .contains(actionKey),
                minionName + " should be NRA-locked from " + actionKey);
    }
}

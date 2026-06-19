package net.deckserver.jol.cucumber.steps;

import io.cucumber.java.en.And;
import io.cucumber.java.en.Then;
import net.deckserver.jol.cucumber.GameWorld;
import net.deckserver.jol.enums.ActionStatus;
import net.deckserver.jol.enums.RegionType;
import net.deckserver.jol.enums.RestrictionType;
import net.deckserver.jol.enums.SequencingWindowType;
import net.deckserver.jol.exception.GameRuleException;
import net.deckserver.jol.game.CardData;
import net.deckserver.jol.game.PendingActionState;
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

    @Then("the CARD_AS_PLAYED window should be open")
    public void assertCardAsPlayedWindowOpen() {
        assertNotNull(world.game.getSequencingWindow(), "No sequencing window is open");
        assertTrue(world.game.getSequencingWindow().isActive(), "Sequencing window is not active");
        assertEquals(SequencingWindowType.CARD_AS_PLAYED, world.game.getSequencingWindow().getWindowType(),
                "Sequencing window type should be CARD_AS_PLAYED");
    }

    @Then("{string} should be in action limbo")
    public void assertInActionLimbo(String cardName) {
        assertNotNull(world.game.getPendingAction(), "No pending action");
        String limboId = world.game.getPendingAction().getActionCardId();
        assertNotNull(limboId, "No action card in limbo");
        CardData card = world.game.getCard(limboId);
        assertNotNull(card, "Action limbo card not found in game");
        assertEquals(cardName, card.getName(),
                "Expected '" + cardName + "' in action limbo but found '" + card.getName() + "'");
    }

    @Then("{string}'s hand size should increase by {int}")
    public void assertHandSizeIncrease(String player, int delta) {
        int before = world.handSizeBefore.getOrDefault(player, 0);
        int after = world.game.getPlayer(player).getRegion(RegionType.HAND).getCards().size();
        assertEquals(before + delta, after,
                player + "'s hand size should have increased by " + delta + " (was " + before + ", now " + after + ")");
    }

    @Then("{string} should be restricted from {word} this action")
    public void assertRestricted(String minionName, String restrictionTypeName) {
        CardRef ref = world.minionRefs.get(minionName);
        assertNotNull(ref, "No ref registered for minion '" + minionName + "'");
        PendingActionState pending = world.game.getPendingAction();
        assertNotNull(pending, "No pending action");
        RestrictionType type = RestrictionType.valueOf(restrictionTypeName);
        assertTrue(pending.isRestricted(type, ref),
                minionName + " should be restricted from " + restrictionTypeName + " but is not");
    }

    @Then("no action restrictions should be recorded")
    public void assertNoRestrictions() {
        PendingActionState pending = world.game.getPendingAction();
        assertNotNull(pending, "No pending action");
        assertTrue(pending.getActionRestrictions().isEmpty(),
                "Expected no action restrictions but found: " + pending.getActionRestrictions());
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

    @Then("blocks should be declined")
    public void assertBlocksDeclined() {
        assertNotNull(world.game.getPendingAction(), "No pending action");
        assertTrue(world.game.getPendingAction().isBlocksDeclined(),
                "Expected blocksDeclined = true but was false");
    }

    @Then("blocks should not be declined")
    public void assertBlocksNotDeclined() {
        assertNotNull(world.game.getPendingAction(), "No pending action");
        assertFalse(world.game.getPendingAction().isBlocksDeclined(),
                "Expected blocksDeclined = false but was true");
    }
}

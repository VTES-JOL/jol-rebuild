package net.deckserver.jol.cucumber.steps;

import io.cucumber.java.en.And;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import io.quarkus.arc.Arc;
import net.deckserver.jol.cucumber.GameWorld;
import net.deckserver.jol.enums.RegionType;
import net.deckserver.jol.game.CardData;
import net.deckserver.jol.game.PlayerData;
import net.deckserver.jol.game.RegionData;
import net.deckserver.jol.game.ReferendumState;
import net.deckserver.jol.game.command.*;
import net.deckserver.jol.services.GameCommandService;

import static org.junit.jupiter.api.Assertions.*;

public class ReferendumSteps {

    private final GameWorld world;
    private final GameCommandService commandService;

    public ReferendumSteps(GameWorld world) {
        this.world = world;
        this.commandService = Arc.container().select(GameCommandService.class).get();
    }

    // ── Given ─────────────────────────────────────────────────────────────────

    @And("{string} has title {string}")
    public void setVampireTitle(String minionName, String title) {
        CardRef ref = world.minionRefs.get(minionName);
        assertNotNull(ref, "No ref registered for minion: " + minionName);
        CardData card = world.game.getCardByRef(ref);
        assertNotNull(card, "Card not found for minion: " + minionName);
        card.setTitle(title);
    }

    @And("{string} holds the Edge")
    public void setEdgeHolder(String player) {
        PlayerData playerData = world.game.getPlayer(player);
        world.game.setEdge(playerData);
    }

    // ── When ──────────────────────────────────────────────────────────────────

    @And("{string} opens polling")
    public void openPolling(String actor) {
        world.lastException = null;
        try {
            commandService.execute(actor, new OpenPolling(world.gameId));
        } catch (Exception e) {
            world.lastException = e;
        }
    }

    @And("{string} casts {int} votes FOR with {string}")
    public void castVotesFor(String player, int amount, String minionName) {
        castVotesInternal(player, amount, minionName, "FOR");
    }

    @And("{string} casts {int} votes AGAINST with {string}")
    public void castVotesAgainst(String player, int amount, String minionName) {
        castVotesInternal(player, amount, minionName, "AGAINST");
    }

    @And("{string} tries to cast {int} votes FOR with {string}")
    public void tryCastVotesFor(String player, int amount, String minionName) {
        castVotesInternal(player, amount, minionName, "FOR");
    }

    @And("{string} burns {string} FOR a vote")
    public void burnCardForVote(String player, String cardName) {
        world.lastException = null;
        String cardId = world.cardIdByName.get(cardName);
        if (cardId == null) {
            world.lastException = new IllegalStateException("No card registered: " + cardName);
            return;
        }
        CardRef ref = findCardInHand(player, cardId);
        if (ref == null) {
            world.lastException = new IllegalStateException("Card '" + cardName + "' not in " + player + "'s hand");
            return;
        }
        try {
            commandService.execute(player, new BurnCardForVote(world.gameId, player, ref, "FOR"));
        } catch (Exception e) {
            world.lastException = e;
        }
    }

    @And("{string} burns the Edge FOR a vote")
    public void burnEdgeForVote(String player) {
        world.lastException = null;
        try {
            commandService.execute(player, new BurnEdgeForVote(world.gameId, player, "FOR"));
        } catch (Exception e) {
            world.lastException = e;
        }
    }

    @And("{string} casts a Prisci ballot FOR with {string}")
    public void castPrisciBallotFor(String player, String minionName) {
        castPrisciBallotInternal(player, minionName, "FOR");
    }

    @And("{string} casts a Prisci ballot AGAINST with {string}")
    public void castPrisciBallotAgainst(String player, String minionName) {
        castPrisciBallotInternal(player, minionName, "AGAINST");
    }

    @And("{string} closes polling")
    public void closePolling(String actor) {
        world.lastException = null;
        try {
            commandService.execute(actor, new ClosePolling(world.gameId));
        } catch (Exception e) {
            world.lastException = e;
        }
    }

    // ── Then ──────────────────────────────────────────────────────────────────

    @Then("a referendum should be open")
    public void assertReferendumOpen() {
        assertNotNull(world.game.getReferendum(), "Expected a referendum to be open");
    }

    @Then("no referendum should be open")
    public void assertNoReferendum() {
        assertNull(world.game.getReferendum(), "Expected no referendum to be open");
    }

    @Then("the referendum should not be in polling yet")
    public void assertPollingNotOpen() {
        ReferendumState ref = world.game.getReferendum();
        assertNotNull(ref, "No referendum open");
        assertFalse(ref.isPollingOpen(), "Expected polling to be closed");
    }

    @Then("the referendum polling should be open")
    public void assertPollingOpen() {
        ReferendumState ref = world.game.getReferendum();
        assertNotNull(ref, "No referendum open");
        assertTrue(ref.isPollingOpen(), "Expected polling to be open");
    }

    @Then("{string} should have {int} vote for in the referendum")
    public void assertPlayerVotesFor(String player, int expected) {
        ReferendumState ref = world.game.getReferendum();
        assertNotNull(ref, "No referendum open");
        int[] votes = ref.getVotesByPlayer().getOrDefault(player, new int[]{0, 0});
        assertEquals(expected, votes[0],
                player + " should have " + expected + " vote(s) for but has " + votes[0]);
    }

    @Then("the referendum should have {int} votes for and {int} against")
    public void assertVoteTotals(int expectedFor, int expectedAgainst) {
        ReferendumState ref = world.game.getReferendum();
        assertNotNull(ref, "No referendum open");
        assertEquals(expectedFor, ref.totalVotesFor(),
                "Expected " + expectedFor + " votes for but got " + ref.totalVotesFor());
        assertEquals(expectedAgainst, ref.totalVotesAgainst(),
                "Expected " + expectedAgainst + " votes against but got " + ref.totalVotesAgainst());
    }

    @Then("{string} should be in the ash heap")
    public void assertCardInAshHeap(String cardName) {
        String cardId = world.cardIdByName.get(cardName);
        assertNotNull(cardId, "No card registered: " + cardName);
        CardData card = world.game.getCard(cardId);
        assertNotNull(card, "Card not found: " + cardName);
        assertNotNull(card.getRegion(), "Card has no region");
        assertEquals(RegionType.ASH_HEAP, card.getRegion().getType(),
                cardName + " should be in ASH_HEAP but is in " + card.getRegion().getType());
    }

    @Then("no player should hold the Edge")
    public void assertNoEdgeHolder() {
        assertNull(world.game.getEdge(), "Expected no Edge holder but " + world.game.getEdgePlayer() + " holds it");
    }

    @Then("the Prisci contribution should be {int} votes for")
    public void assertPrisciVotesFor(int expected) {
        ReferendumState ref = world.game.getReferendum();
        assertNotNull(ref, "No referendum open");
        assertEquals(expected, ref.getPrisciVotesFor(),
                "Expected Prisci contribution of " + expected + " FOR but got " + ref.getPrisciVotesFor());
    }

    @Then("the Prisci contribution should be {int} votes")
    public void assertPrisciVotesTotal(int expected) {
        ReferendumState ref = world.game.getReferendum();
        assertNotNull(ref, "No referendum open");
        int total = ref.getPrisciVotesFor() + ref.getPrisciVotesAgainst();
        assertEquals(expected, total,
                "Expected total Prisci contribution of " + expected + " but got " + total);
    }

    @Then("the referendum should have passed")
    public void assertReferendumPassed() {
        assertNotNull(world.game.getPendingAction(), "No pending action");
        assertTrue(world.game.getPendingAction().isReferendumSuccessful(),
                "Expected referendum to have passed but it failed");
    }

    @Then("the referendum should have failed")
    public void assertReferendumFailed() {
        assertNotNull(world.game.getPendingAction(), "No pending action");
        assertFalse(world.game.getPendingAction().isReferendumSuccessful(),
                "Expected referendum to have failed but it passed");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void castVotesInternal(String player, int amount, String minionName, String forOrAgainst) {
        world.lastException = null;
        CardRef ref = world.minionRefs.get(minionName);
        if (ref == null) {
            world.lastException = new IllegalStateException("No ref for minion: " + minionName);
            return;
        }
        try {
            commandService.execute(player, new CastVotes(world.gameId, player, ref, amount, forOrAgainst));
        } catch (Exception e) {
            world.lastException = e;
        }
    }

    private void castPrisciBallotInternal(String player, String minionName, String forOrAgainst) {
        world.lastException = null;
        CardRef ref = world.minionRefs.get(minionName);
        if (ref == null) {
            world.lastException = new IllegalStateException("No ref for minion: " + minionName);
            return;
        }
        try {
            commandService.execute(player, new CastPrisciBallot(world.gameId, ref, forOrAgainst));
        } catch (Exception e) {
            world.lastException = e;
        }
    }

    private CardRef findCardInHand(String player, String cardId) {
        RegionData hand = world.game.getPlayer(player).getRegion(RegionType.HAND);
        java.util.List<CardData> cards = hand.getCards();
        for (int i = 0; i < cards.size(); i++) {
            if (cardId.equals(cards.get(i).getId())) {
                return new CardRef(player, RegionType.HAND, i, -1);
            }
        }
        return null;
    }
}

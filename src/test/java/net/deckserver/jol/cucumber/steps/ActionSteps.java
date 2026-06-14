package net.deckserver.jol.cucumber.steps;

import io.cucumber.java.en.And;
import io.cucumber.java.en.When;
import io.quarkus.arc.Arc;
import net.deckserver.jol.cucumber.GameWorld;
import net.deckserver.jol.enums.ActionType;
import net.deckserver.jol.enums.CardType;
import net.deckserver.jol.enums.RegionType;
import net.deckserver.jol.enums.RestrictionType;
import net.deckserver.jol.game.CardData;
import net.deckserver.jol.game.RegionData;
import net.deckserver.jol.game.command.*;
import net.deckserver.jol.game.effect.GameEffectApplicator;
import net.deckserver.jol.game.effect.RestrictionAddedEffect;
import net.deckserver.jol.services.GameCommandService;

public class ActionSteps {

    private final GameWorld world;
    private final GameCommandService commandService;

    public ActionSteps(GameWorld world) {
        this.world = world;
        this.commandService = Arc.container().select(GameCommandService.class).get();
    }

    @When("{string} declares a {word} action")
    public void declareUndirectedAction(String player, String actionType) {
        world.lastException = null;
        CardRef ref = firstMinionOf(player);
        try {
            commandService.execute(player, new DeclareAction(
                    world.gameId, ref, ActionType.valueOf(actionType), null));
        } catch (Exception e) {
            world.lastException = e;
        }
    }

    @When("{string} declares a {word} action targeting {string}")
    public void declareDirectedAction(String player, String actionType, String target) {
        world.lastException = null;
        CardRef ref = firstMinionOf(player);
        try {
            commandService.execute(player, new DeclareAction(
                    world.gameId, ref, ActionType.valueOf(actionType), target));
        } catch (Exception e) {
            world.lastException = e;
        }
    }

    @When("{string} declares a {word} action with {string}")
    public void declareActionWithMinion(String player, String actionType, String minionName) {
        world.lastException = null;
        CardRef ref = world.minionRefs.get(minionName);
        try {
            commandService.execute(player, new DeclareAction(
                    world.gameId, ref, ActionType.valueOf(actionType), null));
        } catch (Exception e) {
            world.lastException = e;
        }
    }

    @When("all players pass the impulse window")
    public void passAllImpulse() {
        world.lastException = null;
        try {
            commandService.execute(world.game.getCurrentPlayerName(),
                    new CloseImpulseWindow(world.gameId));
        } catch (Exception e) {
            world.lastException = e;
        }
    }

    @When("{string} passes the impulse")
    public void passImpulse(String player) {
        world.lastException = null;
        try {
            commandService.execute(player, new PassImpulse(world.gameId, player));
        } catch (Exception e) {
            world.lastException = e;
        }
    }

    @When("{string} resolves the action")
    public void resolveAction(String player) {
        world.lastException = null;
        // Snapshot pool values before resolution for "decrease by" assertions
        world.game.getPlayerOrder().forEach(p ->
                world.poolBefore.put(p, world.game.getPlayer(p).getPool()));
        try {
            commandService.execute(player, new ResolveAction(world.gameId));
        } catch (Exception e) {
            world.lastException = e;
        }
    }

    @When("{string} attempts to block with {string}")
    public void attemptBlock(String player, String minionName) {
        world.lastException = null;
        CardRef ref = world.minionRefs.get(minionName);
        try {
            commandService.execute(player, new AttemptBlock(world.gameId, ref));
        } catch (Exception e) {
            world.lastException = e;
        }
    }

    @When("{string} cannot block before receiving the impulse")
    public void cannotBlockBeforeImpulse(String player) {
        world.lastException = null;
        CardRef ref = firstMinionOf(player);
        try {
            commandService.execute(player, new AttemptBlock(world.gameId, ref));
        } catch (Exception e) {
            world.lastException = e;
        }
    }

    @And("the sequencing window closes")
    public void closeSequencing() {
        world.lastException = null;
        try {
            commandService.execute(world.game.getCurrentPlayerName(),
                    new CloseSequencingWindow(world.gameId));
        } catch (Exception e) {
            world.lastException = e;
        }
    }

    @When("{string} plays {string} as {word} {word} card")
    public void playCard(String player, String cardName, String article, String cardTypeName) {
        world.lastException = null;
        String cardId = world.cardIdByName.get(cardName);
        if (cardId == null) {
            world.lastException = new IllegalStateException("No card registered with name: " + cardName);
            return;
        }
        CardRef ref = findCardRefInHand(player, cardId);
        if (ref == null) {
            world.lastException = new IllegalStateException("Card '" + cardName + "' not found in " + player + "'s hand");
            return;
        }
        try {
            commandService.execute(player, new PlayCard(world.gameId, ref, null, null, CardType.valueOf(cardTypeName)));
        } catch (Exception e) {
            world.lastException = e;
        }
    }

    @And("{string} snapshots {word} hand size")
    public void snapshotHandSize(String player, String pronoun) {
        world.lastException = null;
        int size = world.game.getPlayer(player).getRegion(RegionType.HAND).getCards().size();
        world.handSizeBefore.put(player, size);
    }

    @And("all players pass the card-as-played window")
    public void passCardAsPlayedWindow() {
        world.lastException = null;
        try {
            commandService.execute(world.game.getCurrentPlayerName(),
                    new CloseSequencingWindow(world.gameId));
        } catch (Exception e) {
            world.lastException = e;
        }
    }

    @And("a {word} restriction is applied to {string} with reason {string}")
    public void applyRestriction(String restrictionTypeName, String minionName, String reason) {
        world.lastException = null;
        CardRef ref = world.minionRefs.get(minionName);
        if (ref == null) {
            world.lastException = new IllegalStateException("No ref registered for minion: " + minionName);
            return;
        }
        RestrictionType type = RestrictionType.valueOf(restrictionTypeName);
        GameEffectApplicator.apply(world.game, new RestrictionAddedEffect(type, ref, null, reason));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private CardRef findCardRefInHand(String player, String cardId) {
        RegionData hand = world.game.getPlayer(player).getRegion(RegionType.HAND);
        java.util.List<CardData> cards = hand.getCards();
        for (int i = 0; i < cards.size(); i++) {
            if (cardId.equals(cards.get(i).getId())) {
                return new CardRef(player, RegionType.HAND, i, -1);
            }
        }
        return null;
    }

    /** Returns the CardRef of the first minion registered for the given player. */
    private CardRef firstMinionOf(String player) {
        return world.minionRefs.values().stream()
                .filter(ref -> ref.playerName().equals(player))
                .findFirst()
                .orElse(null);
    }
}

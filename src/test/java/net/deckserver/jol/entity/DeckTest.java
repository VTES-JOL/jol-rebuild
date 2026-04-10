package net.deckserver.jol.entity;

import io.quarkus.test.TestTransaction;
import io.quarkus.test.junit.QuarkusTest;
import net.deckserver.jol.enums.Role;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@QuarkusTest
public class DeckTest {

    @Test
    @TestTransaction
    public void createDeck() {
        User user = User.create("deckuser", "password", "deck@test.com", Role.USER);
        String name = "My Deck";
        String contents = "{\"cards\": []}";
        String summary = "A test deck";

        Deck deck = Deck.create(user, name, contents, summary);

        assertNotNull(deck.id);
        assertEquals(user, deck.user);
        assertEquals(name, deck.name);
        assertEquals(contents, deck.contents);
        assertEquals(summary, deck.summary);
        assertNotNull(deck.timestamp);
    }

    @Test
    @TestTransaction
    public void findByUsername() {
        User user1 = User.create("user1", "pass", "user1@test.com", Role.USER);
        User user2 = User.create("user2", "pass", "user2@test.com", Role.USER);

        Deck.create(user1, "Deck 1", "{}", "Summary 1");
        Deck.create(user1, "Deck 2", "{}", "Summary 2");
        Deck.create(user2, "Deck 3", "{}", "Summary 3");

        assertEquals(2, Deck.findByUsername("user1").size());
        assertEquals(1, Deck.findByUsername("user2").size());
        assertEquals(0, Deck.findByUsername("nonexistent").size());
    }
}

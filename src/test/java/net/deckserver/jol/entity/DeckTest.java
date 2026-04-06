package net.deckserver.jol.entity;

import io.quarkus.test.TestTransaction;
import io.quarkus.test.junit.QuarkusTest;
import net.deckserver.jol.enums.Role;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

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
    }
}

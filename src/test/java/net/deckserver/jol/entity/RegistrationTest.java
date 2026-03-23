package net.deckserver.jol.entity;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.transaction.Transactional;
import net.deckserver.jol.enums.GameFormat;
import net.deckserver.jol.enums.Visibility;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.nullValue;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

@QuarkusTest
public class RegistrationTest {

    private static String contents;
    User user;
    Game game;
    Deck deck;

    @BeforeAll
    static void init() throws IOException {
        contents = Files.readString(Paths.get("src/test/resources/deck1.json"));
    }

    @Test
    @Transactional
    public void invite() {
        Registration registration = Registration.invite(game, user);
        assertNotNull(registration.id);
        // invite again has no effect
        Registration.invite(game, user);
        assertThat(Registration.getInvites(game).size(), equalTo(1));
        assertThat(Registration.getRegistrations(game).size(), equalTo(0));
        assertThat(User.getInvites("ShanDow").size(), equalTo(1));
        assertThat(User.getRegistrations("ShanDow").size(), equalTo(0));
    }

    @Test
    @Transactional
    public void register() {
        Registration.invite(game, user);
        Registration registration = Registration.register(game, user, deck);
        assertNotNull(registration.id);
        assertThat(Registration.getRegistrations(game).size(), equalTo(1));
        assertThat(Registration.getInvites(game).size(), equalTo(0));
        assertThat(User.getInvites("ShanDow").size(), equalTo(0));
        assertThat(User.getRegistrations("ShanDow").size(), equalTo(1));
    }

    @Test
    @Transactional
    public void registerWithoutInviteThrows() {
        assertThrows(IllegalArgumentException.class, () -> Registration.register(game, user, deck));
    }

    @Test
    @Transactional
    public void deleteCascade() {
        User user2 = User.create("NewUser2", "password", "test@example.org");
        Game game2 = Game.create(user2, "Another Game", Visibility.PUBLIC, GameFormat.STANDARD);
        Registration.invite(game2, user2);

        long initialCount = Registration.count();
        assertThat(Registration.getInvites(game2).size(), equalTo(1));

        game2.delete();

        assertThat(Game.findById(game2.id), nullValue());
        assertThat(Registration.count(), equalTo(initialCount - 1));
        assertThat(Registration.findByGameAndUser(game2, user2), nullValue());

    }

    @BeforeEach
    @Transactional
    void setup() {
        user = User.create("ShanDow", "password", "test@example.org");
        game = Game.create(user, "Test Game", Visibility.PUBLIC, GameFormat.STANDARD);
        deck = Deck.create(user, "Test Deck", contents, "Crypt: 12, Library: 90, Groups: 5-6");
    }

    @AfterEach
    @Transactional
    void destroy() {
        game.delete();
        user.delete();
    }
}

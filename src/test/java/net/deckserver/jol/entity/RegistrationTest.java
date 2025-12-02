package net.deckserver.jol.entity;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.transaction.Transactional;
import net.deckserver.jol.enums.Visibility;
import org.junit.jupiter.api.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@QuarkusTest
public class RegistrationTest {

    User user;
    Game game;

    private static String contents;

    @BeforeAll
    static void init() throws IOException {
        contents = Files.readString(Paths.get("src/test/resources/deck1.json"));
    }

    @BeforeEach
    @Transactional
    void setup() {
        user = User.add("ShanDow", "password", "test@example.org");
        game = Game.create("Test Game", Visibility.PUBLIC);
    }

    @AfterEach
    @Transactional
    void destroy() {
        user.delete();
        game.delete();
    }

    @Test
    @Transactional
    public void invite() {
        Registration registration = Registration.invite(game, user);
        Registration.flush();
        assertNotNull(registration.id);
        // invite again has no effect
        Registration.invite(game, user);
        Registration.flush();
        assertThat(Registration.getInvites(game).size(), equalTo(1));
        assertThat(User.getInvites("ShanDow").size(), equalTo(1));
        assertThat(User.getRegistrations("ShanDow").size(), equalTo(0));
    }

    @Test
    @Transactional
    public void register() {
        Registration registration = Registration.invite(game, user);
        registration.register(contents, "Test Deck", "Crypt: 12, Library: 90, Groups: 5-6");
        assertThat(Registration.getRegistrations(game).size(), equalTo(1));
        assertThat(Registration.getInvites(game).size(), equalTo(0));
        assertThat(User.getInvites("ShanDow").size(), equalTo(0));
        assertThat(User.getRegistrations("ShanDow").size(), equalTo(1));
    }
}

package net.deckserver.jol.entity;

import io.quarkus.test.TestTransaction;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.transaction.Transactional;
import net.deckserver.jol.enums.GameFormat;
import net.deckserver.jol.enums.Role;
import net.deckserver.jol.enums.Visibility;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

@QuarkusTest
public class GameTest {

    @BeforeEach
    @Transactional
    public void setup() {
        Game.deleteAll();
        User.deleteAll();
    }

    @Test
    @TestTransaction
    public void createGameTest() {
        User owner = User.create("New User", "password", "test@example.com", Role.USER);
        Game openGame1 = Game.create(owner, "Public Game 1", Visibility.PUBLIC, GameFormat.STANDARD);
        Game openGame2 = Game.create(owner, "Public Game 2", Visibility.PUBLIC, GameFormat.STANDARD);
        Game privateGame1 = Game.create(owner, "Private Game 1", Visibility.PRIVATE, GameFormat.STANDARD);
        Game privateGame2 = Game.create(owner, "Private Game 2", Visibility.PRIVATE, GameFormat.STANDARD);

        assertEquals(2, Game.findOpenGames().size());
        assertEquals(0, Game.findActiveGames().size());
    }

}

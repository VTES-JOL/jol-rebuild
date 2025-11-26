package net.deckserver.jol.entity;

import io.quarkus.test.TestTransaction;
import io.quarkus.test.junit.QuarkusTest;
import net.deckserver.jol.enums.Visibility;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

@QuarkusTest
public class GameTest {

    @Test
    @TestTransaction
    public void createGameTest() {
        Game openGame1 = Game.create("Public Game 1", Visibility.PUBLIC);
        Game openGame2 = Game.create("Public Game 2", Visibility.PUBLIC);
        Game privateGame1 = Game.create("Private Game 1", Visibility.PRIVATE);
        Game privateGame2 = Game.create("Private Game 2", Visibility.PRIVATE);

        assertEquals(2, Game.findOpenGames().size());
        assertEquals(0, Game.findActiveGames().size());
    }

}

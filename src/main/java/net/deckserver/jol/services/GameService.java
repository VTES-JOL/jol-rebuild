package net.deckserver.jol.services;

import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import net.deckserver.jol.entity.Game;
import net.deckserver.jol.enums.GameFormat;
import net.deckserver.jol.enums.Visibility;

import java.util.List;

// Example: notify the lobby when a new game is created
@ApplicationScoped
public class GameService {

    @Inject
    LobbyChatBroadcaster lobbyChatBroadcaster;

    @Scheduled(every = "1m")
    @Transactional
    public void createGame() {
        for (GameFormat format : GameFormat.values()) {
            List<Game> openGames = Game.findOpenGames(format);
            if (openGames.size() < 5) {
                String gameName = "Test Game " + format.getLabel();
                Game.create(null, gameName, Visibility.PUBLIC, format);
                lobbyChatBroadcaster.announce("A new game \"" + gameName + "\" has been created!");
            }
        }
    }
}
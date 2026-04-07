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

    @Inject
    NameService nameService;

    @Scheduled(every = "1m")
    @Transactional
    public void createGame() {
        for (GameFormat format : GameFormat.values()) {
            List<Game> openGames = Game.findOpenGames(format);
            if (openGames.size() < 5) {
                String gameName = nameService.generateName();
                Game game = Game.create(null, gameName, Visibility.PUBLIC, format);
                String gameToken = String.format("[game:%d:%s]", game.id, gameName);
                lobbyChatBroadcaster.announce("A new game " + gameToken + " has been created!");
            }
        }
    }
}
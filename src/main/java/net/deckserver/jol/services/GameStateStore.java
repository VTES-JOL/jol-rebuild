package net.deckserver.jol.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import net.deckserver.jol.entity.Game;
import net.deckserver.jol.enums.Status;
import net.deckserver.jol.game.GameData;
import org.jboss.logging.Logger;

import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@ApplicationScoped
public class GameStateStore {

    private static final Logger LOG = Logger.getLogger(GameStateStore.class);

    private final ConcurrentHashMap<String, GameData> activeGames = new ConcurrentHashMap<>();

    @Inject
    ObjectMapper mapper;

    @PostConstruct
    @Transactional
    void rehydrate() {
        List<Game> active = Game.find("status", Status.ACTIVE).list();
        for (Game game : active) {
            if (game.gameState == null) continue;
            try {
                GameData data = mapper.readValue(game.gameState, GameData.class);
                activeGames.put(game.id, data);
                LOG.infof("Rehydrated game %s (%s)", game.id, game.name);
            } catch (Exception e) {
                LOG.errorf(e, "Failed to rehydrate game %s", game.id);
            }
        }
        LOG.infof("GameStateStore: rehydrated %d active game(s)", activeGames.size());
    }

    public GameData get(String gameId) {
        return activeGames.get(gameId);
    }

    public void put(String gameId, GameData data) {
        activeGames.put(gameId, data);
    }

    public void remove(String gameId) {
        activeGames.remove(gameId);
    }

    public boolean contains(String gameId) {
        return activeGames.containsKey(gameId);
    }
}

package net.deckserver.jol.services;

import io.quarkus.websockets.next.OpenConnections;
import io.quarkus.websockets.next.UserData;
import io.quarkus.websockets.next.WebSocketConnection;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import net.deckserver.jol.dto.GameMessageDto;
import net.deckserver.jol.dto.GameStateDto;
import net.deckserver.jol.game.GameData;
import org.jboss.logging.Logger;

@ApplicationScoped
public class GameStateBroadcaster {

    private static final Logger LOG = Logger.getLogger(GameStateBroadcaster.class);
    private static final String GAME_WS_PREFIX = "/ws/game/";

    /** Stored in connection UserData on @OnOpen so the broadcaster can read it when iterating OpenConnections. */
    public static final UserData.TypedKey<String> USERNAME_KEY = UserData.TypedKey.forString("username");

    @Inject
    OpenConnections connections;

    @Inject
    GameStateProjector projector;

    /**
     * Sends each player connected to the given game their personalized filtered state.
     */
    public void broadcastState(String gameId, GameData game) {
        connections.stream()
            .filter(conn -> conn.handshakeRequest().path().startsWith(GAME_WS_PREFIX + gameId))
            .forEach(conn -> sendState(conn, game, GameMessageDto.Type.GAME_STATE));
    }

    /**
     * Sends a full snapshot to a single connection (used on WebSocket open).
     */
    public void sendSnapshot(WebSocketConnection conn, GameData game) {
        sendState(conn, game, GameMessageDto.Type.GAME_SNAPSHOT);
    }

    public void sendError(WebSocketConnection conn, String detail) {
        conn.sendTextAndAwait(GameMessageDto.error(detail));
    }

    private void sendState(WebSocketConnection conn, GameData game, GameMessageDto.Type type) {
        String username = conn.userData().get(USERNAME_KEY);
        if (username == null) {
            LOG.warnf("No username stored for connection %s — skipping state send", conn.id());
            return;
        }
        GameStateDto state = projector.project(game, username);
        GameMessageDto msg = type == GameMessageDto.Type.GAME_SNAPSHOT
            ? GameMessageDto.snapshot(state)
            : GameMessageDto.stateUpdate(state);
        conn.sendTextAndAwait(msg);
    }
}

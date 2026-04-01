package net.deckserver.jol.ws;

import io.quarkus.security.identity.SecurityIdentity;
import io.quarkus.websockets.next.*;
import jakarta.inject.Inject;
import net.deckserver.jol.dto.ChatMessageDto;
import net.deckserver.jol.services.GameChatService;
import org.jboss.logging.Logger;

/**
 * Per-game-room chat WebSocket endpoint.
 * <p>
 * Connect:  ws://host/ws/game/{gameId}/{userName}
 * <p>
 * Quarkus WS Next automatically isolates broadcast scope to sessions that
 * share the same path — so messages sent in game "abc" only reach players
 * connected to /ws/game/abc/{userName}.
 */
@WebSocket(path = "/ws/game/{gameId}")
public class GameWebSocket {

    private static final Logger LOG = Logger.getLogger(GameWebSocket.class);

    @Inject
    WebSocketConnection connection;

    @Inject
    GameChatService chatService;

    @Inject
    SecurityIdentity identity;

    // ── Lifecycle ─────────────────────────────────────────────────────────

    @OnOpen
    public void onOpen(@PathParam String gameId) {
        LOG.infof("Game [%s]: %s connected (session %s)", gameId, userName(), connection.id());
        ChatMessageDto history = chatService.historyPayload(gameId);
        connection.sendTextAndAwait(history);
    }

    @OnClose
    public void onClose(@PathParam String gameId) {
        LOG.infof("Game [%s]: %s disconnected (session %s)", gameId, userName(), connection.id());
    }

    @OnTextMessage
    public void onMessage(@PathParam String gameId, ChatMessageDto incoming) {
        String content = incoming.content == null ? "" : incoming.content.trim();
        if (content.isEmpty()) {
            connection.sendTextAndAwait(ChatMessageDto.error("Message content cannot be empty"));
        }

        ChatMessageDto saved = chatService.save(gameId, userName(), content);
        connection.broadcast().sendTextAndAwait(saved);
    }

    @OnError
    public void onError(Throwable error) {
        LOG.errorf(error, "Game WS error for session %s", connection.id());
    }

    private String userName() {
        return identity.getPrincipal().getName();
    }
}
package net.deckserver.jol.ws;

import io.quarkus.security.identity.SecurityIdentity;
import io.quarkus.websockets.next.*;
import io.smallrye.common.annotation.Blocking;
import jakarta.enterprise.context.control.ActivateRequestContext;
import jakarta.inject.Inject;
import net.deckserver.jol.dto.ChatMessageDto;
import net.deckserver.jol.services.LobbyChatService;
import org.jboss.logging.Logger;

/**
 * Lobby chat WebSocket endpoint.
 *
 * Connect:  ws://host/ws/lobby/{userName}
 */
@WebSocket(path = "/ws/lobby")
public class LobbyWebSocket {

    private static final Logger LOG = Logger.getLogger(LobbyWebSocket.class);

    @Inject
    WebSocketConnection connection;

    @Inject
    LobbyChatService chatService;

    @Inject
    SecurityIdentity identity;

    // ── Lifecycle ─────────────────────────────────────────────────────────

    @OnOpen
    @Blocking
    @ActivateRequestContext
    public void onOpen() {
        LOG.infof("Lobby: %s connected (session %s)", userName(), connection.id());
        ChatMessageDto history = chatService.historyPayload();
        connection.sendTextAndAwait(history);
    }

    @OnClose
    public void onClose() {
        LOG.infof("Lobby: %s disconnected (session %s)", userName(), connection.id());
    }

    @OnTextMessage
    public void onMessage(ChatMessageDto incoming) {
        String content = incoming.content == null ? "" : incoming.content.trim();
        if (content.isEmpty()) {
            connection.sendTextAndAwait(ChatMessageDto.error("Message content cannot be empty"));
        }

        ChatMessageDto saved = chatService.save(userName(), content);
        connection.broadcast().sendTextAndAwait(saved);
    }

    @OnError
    public void onError(Throwable error) {
        LOG.errorf(error, "Lobby WS error for session %s", connection.id());
    }

    private String userName() {
        return identity.getPrincipal().getName();
    }
}
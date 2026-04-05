package net.deckserver.jol.ws;

import io.quarkus.security.identity.SecurityIdentity;
import io.quarkus.websockets.next.*;
import io.smallrye.common.annotation.Blocking;
import jakarta.enterprise.context.control.ActivateRequestContext;
import jakarta.inject.Inject;
import net.deckserver.jol.dto.ChatMessageDto;
import net.deckserver.jol.services.ChatService;
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
    ChatService chatService;

    @Inject
    SecurityIdentity identity;

    // ── Lifecycle ─────────────────────────────────────────────────────────

    @OnOpen
    @Blocking
    @ActivateRequestContext
    public void onOpen() {
        LOG.infof("Lobby: %s connected (session %s)", userName(), connection.id());
        ChatMessageDto history = chatService.historyPayload(null);
        connection.sendTextAndAwait(history);
    }

    @OnClose
    public void onClose() {
        LOG.infof("Lobby: %s disconnected (session %s)", userName(), connection.id());
    }

    @OnTextMessage
    public void onMessage(ChatMessageDto incoming) {
        switch (incoming.type) {
            case CHAT -> handleChat(incoming);
            case REACTION -> handleReaction(incoming);
            default -> connection.sendTextAndAwait(
                    ChatMessageDto.error("Unsupported message type: " + incoming.type));
        }
    }

    @OnError
    public void onError(Throwable error) {
        LOG.errorf(error, "Lobby WS error for session %s", connection.id());
    }

    private String userName() {
        return identity.getPrincipal().getName();
    }

    private void handleChat(ChatMessageDto incoming) {
        String content = incoming.content == null ? "" : incoming.content.trim();
        if (content.isEmpty()) {
            connection.sendTextAndAwait(ChatMessageDto.error("Message content cannot be empty"));
            return;
        }
        ChatMessageDto saved = chatService.save(null, userName(), content, incoming.replyToId);
        connection.broadcast().sendTextAndAwait(saved);
    }

    private void handleReaction(ChatMessageDto incoming) {
        if (incoming.id == null || incoming.emoji == null) {
            connection.sendTextAndAwait(ChatMessageDto.error("Reaction requires id and emoji"));
            return;
        }
        ChatMessageDto updated = chatService.toggleReaction(incoming.id, userName(), incoming.emoji);
        connection.broadcast().sendTextAndAwait(updated);
    }
}
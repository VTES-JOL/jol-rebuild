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
    private static final int MAX_CONTENT_LENGTH = 4000;
    @Inject
    WebSocketConnection connection;
    @Inject
    ChatService chatService;

    // ── Lifecycle ─────────────────────────────────────────────────────────
    @Inject
    SecurityIdentity identity;

    @OnOpen
    @Blocking
    @ActivateRequestContext
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
        switch (incoming.type) {
            case CHAT -> handleChat(gameId, incoming);
            case REACTION -> handleReaction(incoming);
            default -> connection.sendTextAndAwait(
                    ChatMessageDto.error("Unsupported message type: " + incoming.type));
        }
    }

    @OnError
    public void onError(Throwable error) {
        LOG.errorf(error, "Game WS error for session %s", connection.id());
    }

    private void handleChat(String gameId, ChatMessageDto incoming) {
        String content = incoming.content == null ? "" : incoming.content.trim();
        if (content.isEmpty()) {
            connection.sendTextAndAwait(ChatMessageDto.error("Message content cannot be empty"));
            return;
        }
        if (content.length() > MAX_CONTENT_LENGTH) {
            connection.sendTextAndAwait(ChatMessageDto.error("Message exceeds maximum length of " + MAX_CONTENT_LENGTH + " characters"));
            return;
        }
        if (incoming.replyToId != null && !chatService.messageExistsInGame(incoming.replyToId, gameId)) {
            connection.sendTextAndAwait(ChatMessageDto.error("Reply target not found in this game"));
            return;
        }

        ChatMessageDto saved = chatService.save(gameId, userName(), content, incoming.replyToId);
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

    private String userName() {
        return identity.getPrincipal().getName();
    }
}
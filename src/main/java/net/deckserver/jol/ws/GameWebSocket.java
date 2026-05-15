package net.deckserver.jol.ws;

import io.quarkus.security.identity.SecurityIdentity;
import io.quarkus.websockets.next.*;
import io.smallrye.common.annotation.Blocking;
import jakarta.annotation.security.RolesAllowed;
import jakarta.enterprise.context.control.ActivateRequestContext;
import jakarta.inject.Inject;
import net.deckserver.jol.config.Config;
import net.deckserver.jol.dto.ChatMessageDto;
import net.deckserver.jol.dto.GameMessageDto;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.services.ChatService;
import net.deckserver.jol.services.GameCommandService;
import net.deckserver.jol.services.GameStateBroadcaster;
import net.deckserver.jol.services.GameStateStore;
import org.jboss.logging.Logger;

/**
 * Per-game-room WebSocket endpoint handling both chat and game commands.
 * <p>
 * Connect:  ws://host/ws/game/{gameId}
 * <p>
 * Inbound:  type = CHAT | REACTION | GAME_COMMAND
 * Outbound: type = CHAT | HISTORY | REACTION | ERROR | GAME_STATE | GAME_SNAPSHOT
 */
@WebSocket(path = "/ws/game/{gameId}")
@RolesAllowed("USER")
public class GameWebSocket {

    private static final Logger LOG = Logger.getLogger(GameWebSocket.class);

    @Inject Config config;
    @Inject WebSocketConnection connection;
    @Inject ChatService chatService;
    @Inject SecurityIdentity identity;
    @Inject GameStateStore gameStateStore;
    @Inject GameCommandService commandService;
    @Inject GameStateBroadcaster broadcaster;

    @OnOpen
    @Blocking
    @ActivateRequestContext
    public void onOpen(@PathParam String gameId) {
        String user = userName();
        LOG.infof("Game [%s]: %s connected (session %s)", gameId, user, connection.id());

        // Store username in connection metadata for broadcaster lookup
        connection.userData().put(GameStateBroadcaster.USERNAME_KEY, user);

        // Send chat history
        if (!sendSafely(chatService.historyPayload(gameId))) {
            return;
        }

        // Send game state snapshot if game is active
        GameData game = gameStateStore.get(gameId);
        if (game != null) {
            broadcaster.sendSnapshot(connection, game);
        }
    }

    @OnClose
    public void onClose(@PathParam String gameId) {
        LOG.infof("Game [%s]: %s disconnected (session %s)", gameId, userName(), connection.id());
    }

    @OnTextMessage
    @Blocking
    @ActivateRequestContext
    public void onMessage(@PathParam String gameId, GameMessageDto incoming) {
        if (incoming.type == null) return;
        switch (incoming.type) {
            case CHAT     -> handleChat(gameId, incoming);
            case REACTION -> handleReaction(incoming);
            case GAME_COMMAND -> handleGameCommand(gameId, incoming);
            default -> sendSafely(GameMessageDto.error("Unsupported message type: " + incoming.type));
        }
    }

    @OnError
    public void onError(Throwable error, WebSocketConnection errorConnection) {
        String sessionId = "<unavailable>";
        try {
            sessionId = errorConnection.id();
        } catch (Exception ignored) {
            // The connection context may already be inactive while handling errors.
        }

        LOG.errorf(error, "Game WS error for session %s", sessionId);
        try {
            sendSafely(errorConnection, GameMessageDto.error("Connection error: " + error.getClass().getSimpleName()));
        } catch (Exception ignored) {}
    }

    private void handleChat(String gameId, GameMessageDto incoming) {
        String content = incoming.content == null ? "" : incoming.content.trim();
        if (content.isEmpty()) {
            sendSafely(GameMessageDto.error("Message content cannot be empty"));
            return;
        }
        if (content.length() > config.chat().maxContentLength()) {
            sendSafely(GameMessageDto.error(
                "Message exceeds maximum length of " + config.chat().maxContentLength() + " characters"));
            return;
        }
        if (incoming.replyToId != null && !chatService.messageExistsInGame(incoming.replyToId, gameId)) {
            sendSafely(GameMessageDto.error("Reply target not found in this game"));
            return;
        }
        ChatMessageDto saved = chatService.save(gameId, userName(), content, incoming.replyToId);
        connection.broadcast().sendTextAndAwait(saved);
    }

    private void handleReaction(GameMessageDto incoming) {
        if (incoming.id == null || incoming.emoji == null) {
            sendSafely(GameMessageDto.error("Reaction requires id and emoji"));
            return;
        }
        ChatMessageDto updated = chatService.toggleReaction(incoming.id, userName(), incoming.emoji);
        connection.broadcast().sendTextAndAwait(updated);
    }

    private void handleGameCommand(String gameId, GameMessageDto incoming) {
        if (incoming.command == null) {
            sendSafely(GameMessageDto.error("GAME_COMMAND requires a command payload"));
            return;
        }
        if (!gameId.equals(incoming.command.gameId())) {
            sendSafely(GameMessageDto.error("Command gameId does not match connection gameId"));
            return;
        }
        try {
            GameCommandService.CommandResult result = commandService.execute(userName(), incoming.command);
            if (result.logMessage() != null) {
                ChatMessageDto log = chatService.save(gameId, userName(), result.logMessage(), null);
                connection.broadcast().sendTextAndAwait(log);
            }
            broadcaster.broadcastState(gameId, result.game());
        } catch (IllegalStateException e) {
            sendSafely(GameMessageDto.error(e.getMessage()));
        }
    }

    private boolean sendSafely(Object payload) {
        return sendSafely(connection, payload);
    }

    private boolean sendSafely(WebSocketConnection targetConnection, Object payload) {
        String sessionId = "<unavailable>";
        try {
            sessionId = targetConnection.id();

            if (!targetConnection.isOpen()) {
                LOG.debugf("Skipping send to closed Game WS session %s", sessionId);
                return false;
            }

            targetConnection.sendTextAndAwait(payload);
            return true;
        } catch (RuntimeException e) {
            LOG.debugf(e, "Failed to send to Game WS session %s; connection may have closed", sessionId);
            return false;
        }
    }

    private String userName() {
        return identity.getPrincipal().getName();
    }
}

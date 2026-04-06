package net.deckserver.jol.services;

import io.quarkus.websockets.next.OpenConnections;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import net.deckserver.jol.dto.ChatMessageDto;

/**
 * Allows any CDI bean to broadcast a message to all sessions currently
 * connected to the lobby, without going through LobbyWebSocket directly.
 * <p>
 * Usage example:
 *
 * @Inject LobbyChatBroadcaster broadcaster;
 * <p>
 * broadcaster.announce("Game #42 is starting — join now!");
 * broadcaster.broadcast(ChatMessageDto.chat("System", "Server restarting in 5 minutes", Instant.now()));
 */
@ApplicationScoped
public class LobbyChatBroadcaster {

    private static final String LOBBY_PATH_PREFIX = "/ws/lobby";

    @Inject
    OpenConnections connections;

    @Inject
    ChatService chatService;

    /**
     * Broadcasts an already-constructed ChatMessageDto to all lobby sessions.
     */
    public void broadcast(ChatMessageDto message) {
        connections.stream()
                .filter(conn -> conn.handshakeRequest().path().startsWith(LOBBY_PATH_PREFIX))
                .forEach(conn -> conn.sendTextAndAwait(message));
    }

    /**
     * Convenience method — broadcasts a system announcement message.
     * Shows up in chat as sent by "System" with the current timestamp.
     */
    public void announce(String text) {
        ChatMessageDto dto = chatService.save(null, "SYSTEM", text, null);
        broadcast(dto);
    }
}
package net.deckserver.jol.dto;

import java.time.Instant;

/**
 * The JSON message exchanged over both WebSocket endpoints.
 *
 * Client → Server:  type = CHAT | PING
 * Server → Client:  type = CHAT | HISTORY | ERROR | PONG
 */
public class ChatMessageDto {

    public enum Type {
        /**
         * A regular chat message (both directions).
         */
        CHAT,
        /**
         * Server sends recent history on connect.
         */
        HISTORY,
        /**
         * Server signals a problem (e.g. empty content).
         */
        ERROR
    }

    public Type type;

    /**
     * Username of the sender (filled by server on inbound messages).
     */
    public String sender;

    /**
     * The chat text (for CHAT type).
     */
    public String content;

    /**
     * ISO-8601 timestamp set by the server.
     */
    public Instant timestamp;

    /**
     * For HISTORY messages: the ordered list of recent messages.
     * Null for all other types.
     */
    public java.util.List<ChatMessageDto> history;

    /**
     * Optional error detail for ERROR type.
     */
    public String error;

    // ── Factories ──────────────────────────────────────────────────────────

    public static ChatMessageDto chat(String sender, String content, Instant timestamp) {
        ChatMessageDto dto = new ChatMessageDto();
        dto.type = Type.CHAT;
        dto.sender = sender;
        dto.content = content;
        dto.timestamp = timestamp;
        return dto;
    }

    public static ChatMessageDto history(java.util.List<ChatMessageDto> messages) {
        ChatMessageDto dto = new ChatMessageDto();
        dto.type = Type.HISTORY;
        dto.history = messages;
        return dto;
    }

    public static ChatMessageDto error(String detail) {
        ChatMessageDto dto = new ChatMessageDto();
        dto.type = Type.ERROR;
        dto.error = detail;
        return dto;
    }
}
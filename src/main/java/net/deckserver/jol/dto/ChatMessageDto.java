package net.deckserver.jol.dto;

import java.time.Instant;
import java.util.List;

/**
 * The JSON message exchanged over both WebSocket endpoints.
 * <p>
 * Client → Server:  type = CHAT | PING
 * Server → Client:  type = CHAT | HISTORY | ERROR | PONG
 */
public class ChatMessageDto {

    public Type type;
    public String sender;
    public String content;
    public Instant timestamp;
    public Long id;                        // message ID — needed for reaction targeting
    public ReplySnapshotDto replyTo;       // null unless this is a reply
    public List<ReactionDto> reactions;    // null on outbound CHAT, populated in HISTORY
    public java.util.List<ChatMessageDto> history;
    public String error;
    public Long replyToId;   // client sends this when replying
    public String emoji;     // client sends this for REACTION messages

    public static ChatMessageDto chat(Long id, String sender, String content,
                                      Instant timestamp, ReplySnapshotDto replyTo,
                                      List<ReactionDto> reactions) {
        ChatMessageDto dto = new ChatMessageDto();
        dto.type = Type.CHAT;
        dto.id = id;
        dto.sender = sender;
        dto.content = content;
        dto.timestamp = timestamp;
        dto.replyTo = replyTo;
        dto.reactions = reactions != null ? reactions : List.of();
        return dto;
    }

    // ── Factories ──────────────────────────────────────────────────────────

    // Reaction broadcast factory:
    public static ChatMessageDto reaction(Long messageId, List<ReactionDto> updatedReactions) {
        ChatMessageDto dto = new ChatMessageDto();
        dto.type = Type.REACTION;
        dto.id = messageId;
        dto.reactions = updatedReactions;
        return dto;
    }

    public static ChatMessageDto history(List<ChatMessageDto> messages) {
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

    public enum Type {CHAT, HISTORY, ERROR, REACTION}
}
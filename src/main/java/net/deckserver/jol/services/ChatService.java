package net.deckserver.jol.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import net.deckserver.jol.config.Config;
import net.deckserver.jol.dto.ChatMessageDto;
import net.deckserver.jol.dto.ReactionDto;
import net.deckserver.jol.dto.ReplySnapshotDto;
import net.deckserver.jol.entity.ChatMessage;
import net.deckserver.jol.entity.ChatMessageReaction;
import net.deckserver.jol.entity.ChatReadMarker;
import net.deckserver.jol.game.command.CommandContext;
import org.jboss.logging.Logger;

import java.util.List;
import java.util.stream.Collectors;

@ApplicationScoped
public class ChatService {

    private static final Logger LOG = Logger.getLogger(ChatService.class);

    @Inject
    Config config;

    @Inject
    ObjectMapper mapper;

    @Transactional
    public ChatMessageDto save(String gameId, String sender, String content, String replyToId) {
        ChatMessage replyTo = replyToId != null ? ChatMessage.findById(replyToId) : null;
        ChatMessage entity = ChatMessage.create(gameId, sender, content, replyTo);

        ReplySnapshotDto replySnapshot = replyTo != null
                ? ReplySnapshotDto.of(replyTo.id, replyTo.sender, replyTo.content)
                : null;

        return ChatMessageDto.chat(entity.id, entity.sender, entity.content,
                entity.timestamp, replySnapshot, List.of());
    }

    @Transactional
    public ChatMessageDto saveCommandLog(String gameId, String sender, String legacyContent, CommandContext ctx) {
        String json = null;
        try {
            json = mapper.writeValueAsString(ctx);
        } catch (JsonProcessingException e) {
            LOG.errorf(e, "Failed to serialize command log");
        }
        ChatMessage entity = ChatMessage.createCommandLog(gameId, sender, legacyContent, json, ctx.turn());
        return ChatMessageDto.commandLog(entity.id, entity.sender, entity.content, entity.timestamp, ctx);
    }

    @Transactional
    public ChatMessageDto toggleReaction(String messageId, String sender, String emoji) {
        ChatMessage message = ChatMessage.findById(messageId);
        if (message == null) throw new IllegalArgumentException("Message not found: " + messageId);

        ChatMessageReaction.toggle(message, sender, emoji);

        List<ReactionDto> reactions = buildReactionDtos(
                ChatMessageReaction.findByMessage(messageId));

        return ChatMessageDto.reaction(messageId, reactions);
    }

    public boolean messageExistsInGame(String messageId, String gameId) {
        ChatMessage msg = ChatMessage.findById(messageId);
        return msg != null && gameId.equals(msg.gameId);
    }

    public ChatMessageDto historyPayload(String gameId) {
        List<ChatMessage> rows = ChatMessage.findRecent(gameId, config.chat().historyLimit());
        List<ChatMessageDto> messages = rows.stream()
                .map(m -> toDto(m))
                .toList();
        return ChatMessageDto.history(messages);
    }

    /** Upper bound on a reconnect digest slice — a very long absence degrades to "and more". */
    static final int SINCE_LIMIT = 500;

    /** The player's persisted read position in this game, or null when never marked. */
    public String getReadMarker(String gameId, String username) {
        ChatReadMarker marker = ChatReadMarker.findByGameAndUser(gameId, username);
        return marker != null ? marker.lastReadMessageId : null;
    }

    /**
     * Advances the player's read position. The message must belong to the
     * game; regressions (marking an older message than the current marker)
     * are ignored so racing devices can only move the marker forward.
     * Returns the effective marker after the call.
     */
    @Transactional
    public String setReadMarker(String gameId, String username, String messageId) {
        ChatMessage target = ChatMessage.findById(messageId);
        if (target == null || !gameId.equals(target.gameId)) {
            throw new IllegalArgumentException("Message not found in game: " + messageId);
        }

        ChatReadMarker marker = ChatReadMarker.findByGameAndUser(gameId, username);
        if (marker == null) {
            marker = new ChatReadMarker();
            marker.gameId = gameId;
            marker.username = username;
            marker.lastReadMessageId = messageId;
            marker.updatedAt = target.timestamp;
            marker.persist();
            return messageId;
        }

        ChatMessage current = ChatMessage.findById(marker.lastReadMessageId);
        if (current == null || !target.timestamp.isBefore(current.timestamp)) {
            marker.lastReadMessageId = messageId;
            marker.updatedAt = target.timestamp;
            return messageId;
        }
        return marker.lastReadMessageId; // regression ignored
    }

    /**
     * Everything after the given message, oldest first — the reconnect-digest
     * slice. An unknown anchor, or one from another game, yields an empty list.
     */
    @Transactional
    public List<ChatMessageDto> getMessagesSince(String gameId, String afterMessageId) {
        ChatMessage anchor = ChatMessage.findById(afterMessageId);
        if (anchor == null || !gameId.equals(anchor.gameId)) return List.of();
        return ChatMessage.findAfter(gameId, anchor.timestamp, SINCE_LIMIT).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public List<ChatMessageDto> getHistory(String gameId, int page, int limit) {
        int effectiveLimit = Math.min(limit, 200);
        List<ChatMessage> rows = ChatMessage.findPaginated(gameId, page, effectiveLimit);
        return rows.stream()
                .map(m -> toDto(m))
                .toList();
    }

    private ChatMessageDto toDto(ChatMessage m) {
        List<ReactionDto> reactions = buildReactionDtos(m.reactions);
        if ("COMMAND_LOG".equals(m.messageType) && m.commandData != null) {
            try {
                CommandContext ctx = mapper.readValue(m.commandData, CommandContext.class);
                return ChatMessageDto.commandLog(m.id, m.sender, m.content, m.timestamp, ctx);
            } catch (Exception e) {
                LOG.warnf("Failed to deserialize command log for message %s; falling back to CHAT", m.id);
            }
        }
        ReplySnapshotDto replySnapshot = m.replyTo != null
                ? ReplySnapshotDto.of(m.replyTo.id, m.replyTo.sender, m.replyTo.content)
                : null;
        return ChatMessageDto.chat(m.id, m.sender, m.content, m.timestamp, replySnapshot, reactions);
    }

    private List<ReactionDto> buildReactionDtos(List<ChatMessageReaction> reactions) {
        return reactions.stream()
                .collect(Collectors.groupingBy(
                        r -> r.emoji,
                        Collectors.mapping(r -> r.sender, Collectors.toList())
                ))
                .entrySet().stream()
                .map(e -> ReactionDto.of(e.getKey(), e.getValue()))
                .toList();
    }
}

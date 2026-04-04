package net.deckserver.jol.services;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import net.deckserver.jol.dto.ChatMessageDto;
import net.deckserver.jol.dto.ReactionDto;
import net.deckserver.jol.dto.ReplySnapshotDto;
import net.deckserver.jol.entity.LobbyMessage;
import net.deckserver.jol.entity.LobbyMessageReaction;

import java.util.List;

@ApplicationScoped
public class LobbyChatService {

    private static final int HISTORY_LIMIT = 50;

    @Transactional
    public ChatMessageDto save(String sender, String content, Long replyToId) {
        LobbyMessage replyTo = replyToId != null ? LobbyMessage.findById(replyToId) : null;
        LobbyMessage entity = LobbyMessage.create(sender, content, replyTo);
        entity.persist();

        ReplySnapshotDto replySnapshot = replyTo != null
                ? ReplySnapshotDto.of(replyTo.id, replyTo.sender, replyTo.content)
                : null;

        return ChatMessageDto.chat(entity.id, entity.sender, entity.content,
                entity.timestamp, replySnapshot, List.of());
    }

    // Overload for messages without a reply
    @Transactional
    public ChatMessageDto save(String sender, String content) {
        return save(sender, content, null);
    }

    /**
     * Toggles a reaction. Returns a REACTION broadcast dto with the full
     * updated reaction state for that message so all clients can sync.
     */
    @Transactional
    public ChatMessageDto toggleReaction(Long messageId, String sender, String emoji) {
        LobbyMessage message = LobbyMessage.findById(messageId);
        if (message == null) throw new IllegalArgumentException("Message not found: " + messageId);

        LobbyMessageReaction.toggle(message, sender, emoji);

        // Re-query reactions fresh after the toggle
        List<ReactionDto> reactions = buildReactionDtos(
                LobbyMessageReaction.findByMessage(messageId));

        return ChatMessageDto.reaction(messageId, reactions);
    }

    public ChatMessageDto historyPayload() {
        List<LobbyMessage> rows = LobbyMessage.findRecentWithDetails(HISTORY_LIMIT);
        List<ChatMessageDto> messages = rows.stream()
                .map(m -> {
                    ReplySnapshotDto replySnapshot = m.replyTo != null
                            ? ReplySnapshotDto.of(m.replyTo.id, m.replyTo.sender, m.replyTo.content)
                            : null;
                    List<ReactionDto> reactions = buildReactionDtos(m.reactions);
                    return ChatMessageDto.chat(m.id, m.sender, m.content,
                            m.timestamp, replySnapshot, reactions);
                })
                .toList();
        return ChatMessageDto.history(messages);
    }

    private List<ReactionDto> buildReactionDtos(List<LobbyMessageReaction> reactions) {
        // Group by emoji, collect sender names
        return reactions.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        r -> r.emoji,
                        java.util.stream.Collectors.mapping(r -> r.sender, java.util.stream.Collectors.toList())
                ))
                .entrySet().stream()
                .map(e -> ReactionDto.of(e.getKey(), e.getValue()))
                .toList();
    }
}
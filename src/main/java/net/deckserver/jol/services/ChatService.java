package net.deckserver.jol.services;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import net.deckserver.jol.config.Config;
import net.deckserver.jol.dto.ChatMessageDto;
import net.deckserver.jol.dto.ReactionDto;
import net.deckserver.jol.dto.ReplySnapshotDto;
import net.deckserver.jol.entity.ChatMessage;
import net.deckserver.jol.entity.ChatMessageReaction;

import java.util.List;
import java.util.stream.Collectors;

@ApplicationScoped
public class ChatService {

    @Inject
    Config config;

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

    @Transactional
    public List<ChatMessageDto> getHistory(String gameId, int page, int limit) {
        int effectiveLimit = Math.min(limit, 200);
        List<ChatMessage> rows = ChatMessage.findPaginated(gameId, page, effectiveLimit);
        return rows.stream()
                .map(m -> {
                    ReplySnapshotDto reply = m.replyTo != null
                            ? ReplySnapshotDto.of(m.replyTo.id, m.replyTo.sender, m.replyTo.content)
                            : null;
                    return ChatMessageDto.chat(m.id, m.sender, m.content,
                            m.timestamp, reply, buildReactionDtos(m.reactions));
                })
                .toList();
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

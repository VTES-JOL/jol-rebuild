package net.deckserver.jol.services;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import net.deckserver.jol.dto.ChatMessageDto;
import net.deckserver.jol.entity.LobbyMessage;

import java.util.List;

@ApplicationScoped
public class LobbyChatService {

    private static final int HISTORY_LIMIT = 50;

    /**
     * Persists an incoming chat message and returns the saved DTO
     * (with server-assigned timestamp) ready to broadcast.
     */
    @Transactional
    public ChatMessageDto save(String sender, String content) {
        LobbyMessage entity = LobbyMessage.create(sender, content);
        entity.persist();
        return ChatMessageDto.chat(entity.sender, entity.content, entity.timestamp);
    }

    /**
     * Loads recent lobby history for a newly connected session.
     */
    public ChatMessageDto historyPayload() {
        List<LobbyMessage> rows = LobbyMessage.findRecent(HISTORY_LIMIT);
        List<ChatMessageDto> messages = rows.stream()
                .map(m -> ChatMessageDto.chat(m.sender, m.content, m.timestamp))
                .toList();
        return ChatMessageDto.history(messages);
    }
}
package net.deckserver.jol.services;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import net.deckserver.jol.dto.ChatMessageDto;
import net.deckserver.jol.entity.GameMessage;

import java.util.List;

@ApplicationScoped
public class GameChatService {

    private static final int HISTORY_LIMIT = 100;

    /**
     * Persists an incoming game chat message and returns the saved DTO.
     */
    @Transactional
    public ChatMessageDto save(String gameId, String sender, String content) {
        GameMessage entity = GameMessage.create(gameId, sender, content);
        entity.persist();
        return ChatMessageDto.chat(entity.sender, entity.content, entity.timestamp);
    }

    /**
     * Loads recent history for this game room on connect.
     */
    public ChatMessageDto historyPayload(String gameId) {
        List<GameMessage> rows = GameMessage.findRecentForGame(gameId, HISTORY_LIMIT);
        List<ChatMessageDto> messages = rows.stream()
                .map(m -> ChatMessageDto.chat(m.sender, m.content, m.timestamp))
                .toList();
        return ChatMessageDto.history(messages);
    }
}

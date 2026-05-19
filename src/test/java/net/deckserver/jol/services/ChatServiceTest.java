package net.deckserver.jol.services;

import io.quarkus.test.TestTransaction;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import net.deckserver.jol.dto.ChatMessageDto;
import net.deckserver.jol.dto.ReactionDto;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for ChatService. Each test runs inside a @TestTransaction
 * that is rolled back on completion, so no inter-test cleanup is needed.
 */
@QuarkusTest
class ChatServiceTest {

    @Inject
    ChatService service;

    private static final String GAME_ID = "chat-service-test-game";

    // ── save ──────────────────────────────────────────────────────────────────

    @Test
    @TestTransaction
    void save_persistsMessageAndReturnsChatDto() {
        ChatMessageDto dto = service.save(GAME_ID, "alice", "hello", null);

        assertNotNull(dto.id);
        assertEquals("alice", dto.sender);
        assertEquals("hello", dto.content);
        assertNull(dto.replyTo);
        assertThat(dto.reactions, empty());
    }

    @Test
    @TestTransaction
    void save_withReply_populatesReplySnapshot() {
        ChatMessageDto original = service.save(GAME_ID, "alice", "original", null);
        ChatMessageDto reply    = service.save(GAME_ID, "bob",   "reply",    original.id);

        assertNotNull(reply.replyTo);
        assertEquals(original.id, reply.replyTo.id);
        assertEquals("alice",    reply.replyTo.sender);
        assertEquals("original", reply.replyTo.content);
    }

    @Test
    @TestTransaction
    void save_withNullReplyToId_hasNoReplySnapshot() {
        ChatMessageDto dto = service.save(GAME_ID, "alice", "standalone", null);

        assertNull(dto.replyTo);
    }

    // ── toggleReaction ────────────────────────────────────────────────────────

    @Test
    @TestTransaction
    void toggleReaction_addsReactionOnFirstCall() {
        ChatMessageDto saved = service.save(GAME_ID, "alice", "hi", null);

        ChatMessageDto result = service.toggleReaction(saved.id, "bob", "👍");

        assertThat(result.reactions, not(empty()));
        ReactionDto reaction = result.reactions.getFirst();
        assertEquals("👍", reaction.emoji);
        assertThat(reaction.senders, hasItem("bob"));
    }

    @Test
    @TestTransaction
    void toggleReaction_removesReactionOnSecondCall() {
        ChatMessageDto saved = service.save(GAME_ID, "alice", "hi", null);
        service.toggleReaction(saved.id, "bob", "👍");

        ChatMessageDto result = service.toggleReaction(saved.id, "bob", "👍");

        assertThat(result.reactions, empty());
    }

    @Test
    @TestTransaction
    void toggleReaction_multipleUsersOnSameEmoji_groupsThem() {
        ChatMessageDto saved = service.save(GAME_ID, "alice", "hi", null);
        service.toggleReaction(saved.id, "bob",   "👍");
        ChatMessageDto result = service.toggleReaction(saved.id, "carol", "👍");

        assertThat(result.reactions, hasSize(1));
        assertThat(result.reactions.getFirst().senders, containsInAnyOrder("bob", "carol"));
    }

    @Test
    @TestTransaction
    void toggleReaction_differentEmojis_produceSeparateGroups() {
        ChatMessageDto saved = service.save(GAME_ID, "alice", "hi", null);
        service.toggleReaction(saved.id, "bob",   "👍");
        ChatMessageDto result = service.toggleReaction(saved.id, "carol", "❤️");

        assertThat(result.reactions, hasSize(2));
    }

    @Test
    @TestTransaction
    void toggleReaction_unknownMessageId_throwsIllegalArgument() {
        assertThrows(IllegalArgumentException.class,
                () -> service.toggleReaction("nonexistent-id", "bob", "👍"));
    }

    // ── messageExistsInGame ───────────────────────────────────────────────────

    @Test
    @TestTransaction
    void messageExistsInGame_trueForCorrectGame() {
        ChatMessageDto saved = service.save(GAME_ID, "alice", "hi", null);

        assertTrue(service.messageExistsInGame(saved.id, GAME_ID));
    }

    @Test
    @TestTransaction
    void messageExistsInGame_falseForDifferentGame() {
        ChatMessageDto saved = service.save(GAME_ID, "alice", "hi", null);

        assertFalse(service.messageExistsInGame(saved.id, "other-game"));
    }

    @Test
    @TestTransaction
    void messageExistsInGame_falseForUnknownMessageId() {
        assertFalse(service.messageExistsInGame("nonexistent-id", GAME_ID));
    }

    // ── historyPayload ────────────────────────────────────────────────────────

    @Test
    @TestTransaction
    void historyPayload_returnsAllMessagesForGame() {
        service.save(GAME_ID, "alice", "msg1", null);
        service.save(GAME_ID, "bob",   "msg2", null);

        ChatMessageDto history = service.historyPayload(GAME_ID);

        assertNotNull(history.history);
        assertThat(history.history, hasSize(2));
    }

    @Test
    @TestTransaction
    void historyPayload_emptyForGameWithNoMessages() {
        ChatMessageDto history = service.historyPayload("no-messages-game");

        assertNotNull(history.history);
        assertThat(history.history, empty());
    }

    @Test
    @TestTransaction
    void historyPayload_messagesAreInChronologicalOrder() {
        service.save(GAME_ID, "alice", "first",  null);
        service.save(GAME_ID, "bob",   "second", null);

        ChatMessageDto history = service.historyPayload(GAME_ID);
        List<ChatMessageDto> msgs = history.history;

        assertThat(msgs, hasSize(2));
        assertFalse(msgs.get(0).timestamp.isAfter(msgs.get(1).timestamp),
                "Messages not in chronological order");
    }

    // ── getHistory ────────────────────────────────────────────────────────────

    @Test
    @TestTransaction
    void getHistory_capsLimitAt200() {
        service.save(GAME_ID, "alice", "msg", null);

        List<ChatMessageDto> result = service.getHistory(GAME_ID, 0, 1000);

        assertThat(result.size(), lessThanOrEqualTo(200));
    }

    @Test
    @TestTransaction
    void getHistory_paginatesResults() {
        for (int i = 0; i < 6; i++) {
            service.save(GAME_ID, "alice", "msg" + i, null);
        }

        List<ChatMessageDto> page0 = service.getHistory(GAME_ID, 0, 3);
        List<ChatMessageDto> page1 = service.getHistory(GAME_ID, 1, 3);

        assertThat(page0, hasSize(3));
        assertThat(page1, hasSize(3));

        // Pages should contain distinct messages
        List<String> ids0 = page0.stream().map(m -> m.id).toList();
        List<String> ids1 = page1.stream().map(m -> m.id).toList();
        assertThat(ids0, not(hasItem(ids1.getFirst())));
    }

    @Test
    @TestTransaction
    void getHistory_returnsEmptyForGameWithNoMessages() {
        List<ChatMessageDto> result = service.getHistory("empty-game", 0, 10);

        assertThat(result, empty());
    }
}

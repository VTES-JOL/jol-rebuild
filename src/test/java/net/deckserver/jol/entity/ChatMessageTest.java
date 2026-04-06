package net.deckserver.jol.entity;

import io.quarkus.test.TestTransaction;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
public class ChatMessageTest {

    @Test
    @TestTransaction
    public void createChatMessage() {
        String gameId = "game1";
        String sender = "user1";
        String content = "Hello world";
        ChatMessage msg = ChatMessage.create(gameId, sender, content, null);

        assertNotNull(msg.id);
        assertEquals(gameId, msg.gameId);
        assertEquals(sender, msg.sender);
        assertEquals(content, msg.content);
        assertNotNull(msg.timestamp);
        assertNull(msg.replyTo);
    }

    @Test
    @TestTransaction
    public void createReply() {
        ChatMessage original = ChatMessage.create(null, "user1", "original", null);
        ChatMessage reply = ChatMessage.create(null, "user2", "reply", original);

        assertNotNull(reply.id);
        assertEquals(original.id, reply.replyTo.id);
    }

    @Test
    @TestTransaction
    public void findRecent() {
        String gameId = "game2";
        for (int i = 0; i < 5; i++) {
            ChatMessage.create(gameId, "user" + i, "content " + i, null);
        }

        List<ChatMessage> recent = ChatMessage.findRecent(gameId, 3);
        assertEquals(3, recent.size());
        // Verify they are in ASC order after fetching by DESC recent
        assertTrue(recent.get(0).timestamp.isBefore(recent.get(1).timestamp) || recent.get(0).timestamp.equals(recent.get(1).timestamp));
        assertTrue(recent.get(1).timestamp.isBefore(recent.get(2).timestamp) || recent.get(1).timestamp.equals(recent.get(2).timestamp));
    }

    @Test
    @TestTransaction
    public void findRecentLobby() {
        for (int i = 0; i < 5; i++) {
            ChatMessage.create(null, "lobby-user" + i, "lobby content " + i, null);
        }

        List<ChatMessage> recent = ChatMessage.findRecent(null, 3);
        assertEquals(3, recent.size());
        for (ChatMessage msg : recent) {
            assertNull(msg.gameId);
        }
    }
}
